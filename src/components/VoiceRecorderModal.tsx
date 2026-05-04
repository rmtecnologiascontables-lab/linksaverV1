import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mic, Square, Pause, Play, RotateCcw, Sparkles, Plus, Trash2,
  GripVertical, Save, Download, X, FileAudio, FileText, CheckCircle2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechRecorder } from '@/hooks/useSpeechRecorder';
import { summarizeToBullets, autoTitle } from '@/lib/voiceSummary';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Stage = 'record' | 'review' | 'saved-confirm';

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function VoiceRecorderModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const addResource = useStore((s) => s.addResource);
  const markReady = useStore((s) => s.markReady);

  const [stage, setStage] = useState<Stage>('record');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [tagsRaw, setTagsRaw] = useState('voz, nota, audio');
  
  // Audio blob para descargar
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // saved-confirm flow
  const [askedDownload, setAskedDownload] = useState(false);
  const [downloadTitle, setDownloadTitle] = useState('');
  const [downloadDescription, setDownloadDescription] = useState('');

  const recorder = useSpeechRecorder({
    onError: (m) => toast({ title: 'Micrófono', description: m, variant: 'destructive' }),
  });

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setStage('record');
      setTitle(''); setDescription(''); setBullets([]); setEditableTranscript('');
      setAskedDownload(false); setDownloadTitle(''); setDownloadDescription('');
      setAudioBlob(null);
      recorder.reset();
    }
  }, [open]);

  const handleStop = async () => {
    console.log('🔴 handleStop llamado. Estado recording:', recorder.recording, 'paused:', recorder.paused);
    
    try {
      const result = await recorder.stop();
      console.log('🔴 Resultado:', result);
      
      const text = result?.transcript || '';
      const audio = result?.audioBlob;
      
      console.log('🔴 Texto transcripción:', text.substring(0, 100));
      
      if (!text.trim()) {
        toast({ title: 'Sin audio', description: 'No se detectó voz. Intenta de nuevo.', variant: 'destructive' });
        return;
      }
      
      const t = autoTitle(text);
      setTitle(t);
      setDownloadTitle(t);
      setBullets(summarizeToBullets(text, 5));
      setEditableTranscript(text);
      setAudioBlob(audio);
      
      console.log('🔴 Cambiando a etapa review');
      setStage('review');
      console.log('🔴 Etapa cambiada a review');
    } catch (error) {
      console.error('Error en handleStop:', error);
      toast({ title: 'Error', description: 'Algo salió mal al procesar la grabación', variant: 'destructive' });
    }
  };

  const updateBullet = (i: number, v: string) =>
    setBullets((b) => b.map((x, idx) => (idx === i ? v : x)));
  const removeBullet = (i: number) => setBullets((b) => b.filter((_, idx) => idx !== i));
  const addBullet = () => setBullets((b) => [...b, '']);
  const moveBullet = (i: number, dir: -1 | 1) => {
    setBullets((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      const copy = [...b];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };
  const regenerate = () => setBullets(summarizeToBullets(editableTranscript, 5));

  const buildSummaryText = () => {
    const cleaned = bullets.map((x) => x.trim()).filter(Boolean);
    return cleaned.map((b, i) => `${i + 1}. ${b}`).join('\n');
  };

  const handleSave = () => {
    const cleanedBullets = bullets.map((x) => x.trim()).filter(Boolean);
    if (!cleanedBullets.length) {
      toast({ title: 'Resumen vacío', description: 'Añade al menos un punto.', variant: 'destructive' });
      return;
    }
    const summary = buildSummaryText();
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    const finalTitle = title.trim() || 'Nota de voz';

    const id = addResource({
      type: 'audio',
      title: finalTitle,
      tags,
      note: editableTranscript,
      aiSummary: summary,
    });
    markReady(id, summary);

    toast({ title: 'Guardado en tu Biblioteca', description: finalTitle });
    setStage('saved-confirm');
  };

  // Convertir WebM a MP3 usando AudioContext
  const convertWebMtoMP3 = async (webMBlob: Blob): Promise<Blob> => {
    try {
      const arrayBuffer = await webMBlob.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      // Crear WAV (más compatible que MP3 desde cliente)
      const wavBlob = audioBufferToWav(audioBuffer);
      audioCtx.close();
      return wavBlob;
    } catch (error) {
      console.error('Error convertiendo audio:', error);
      return webMBlob; // Devolver original si falla
    }
  };

  // Convertir AudioBuffer a WAV
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);
    
    // WAV Header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Interleave canales
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    const length = buffer.length;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Descargar solo el audio (ahora en WAV/MP3)
  const downloadAudioOnly = async () => {
    if (!audioBlob) return;
    
    const safeName = (downloadTitle.trim() || title.trim() || 'nota-de-voice')
      .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
    
    // Convertir a WAV
    const convertedBlob = await convertWebMtoMP3(audioBlob);
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(convertedBlob);
    a.download = `${safeName || 'nota-de-voice'}.mp3`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    
    toast({ title: 'Audio descargado', description: 'Archivo MP3 guardado en tu dispositivo.' });
    onClose();
  };

  // Descargar resumen + transcripción (Markdown)
  const buildMarkdownBlob = () => {
    const lines = [
      `# ${downloadTitle.trim() || title.trim() || 'Nota de voz'}`,
      '',
      downloadDescription.trim() ? downloadDescription.trim() + '\n' : '',
      '## Resumen (5 puntos)',
      ...bullets.filter(Boolean).map((b, i) => `${i + 1}. ${b}`),
      '',
      '## Transcripción completa',
      editableTranscript.trim(),
      '',
      `_Generado por RM Brain · ${new Date().toLocaleString('es-MX')}_`,
    ].filter((l) => l !== null).join('\n');
    return new Blob([lines], { type: 'text/markdown;charset=utf-8' });
  };

  const downloadMarkdown = () => {
    const blob = buildMarkdownBlob();
    const safe = (downloadTitle.trim() || title.trim() || 'nota-de-voz')
      .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${safe || 'nota-de-voice'}.md`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    
    toast({ title: 'Resumen descargado', description: 'Archivo Markdown guardado en tu dispositivo.' });
    onClose();
  };

  // Descargar todo (audio + markdown)
  const downloadEverything = async () => {
    // Primero descargar audio
    downloadAudioOnly();
    // Luego mostrar opción para markdown
    setTimeout(() => {
      const blob = buildMarkdownBlob();
      const safe = (downloadTitle.trim() || title.trim() || 'nota-de-voz')
        .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${safe || 'nota-de-voice'}.md`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    }, 500);
  };

  const wordCount = useMemo(
    () => editableTranscript.trim().split(/\s+/).filter(Boolean).length,
    [editableTranscript],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            {stage === 'record' && 'Grabar nota de voz'}
            {stage === 'review' && 'Revisa y edita tu resumen'}
            {stage === 'saved-confirm' && '¿Qué quieres hacer con tu grabación?'}
          </DialogTitle>
          <DialogDescription>
            {stage === 'record' && 'El audio se procesa en tu navegador. Se grabará el audio y la transcripción.'}
            {stage === 'review' && 'Edita los 5 puntos clave, el título y la transcripción antes de guardar.'}
            {stage === 'saved-confirm' && 'Tu resumen ya está guardado en la Biblioteca. Ahora decide qué más quieres hacer.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ============ STAGE 1: RECORD ============ */}
          {stage === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {!recorder.supported && (
                <div className="glass rounded-xl p-4 text-sm text-destructive">
                  Tu navegador no soporta la Web Speech API. Usa Chrome, Edge o Safari (escritorio) para grabar.
                </div>
              )}

              <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
                <div className={`absolute inset-0 pointer-events-none ${recorder.recording && !recorder.paused ? 'bg-destructive/5' : ''}`} />
                <motion.button
                  onClick={() => {
                    console.log('🔘 Botón presionado. recording:', recorder.recording, 'paused:', recorder.paused);
                    if (recorder.recording || recorder.paused) {
                      handleStop();
                    } else {
                      recorder.start();
                    }
                  }}
                  disabled={!recorder.supported}
                  whileTap={{ scale: 0.92 }}
                  className={`relative w-24 h-24 rounded-full grid place-items-center shadow-glow ring-focus disabled:opacity-50 ${
                    recorder.recording || recorder.paused
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-gradient-primary text-primary-foreground'
                  }`}
                  aria-label={recorder.recording || recorder.paused ? 'Detener' : 'Grabar'}
                >
                  {(recorder.recording || recorder.paused) && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-destructive/40"
                      animate={recorder.paused ? {} : { scale: [1, 1.4], opacity: [0.6, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                  {(recorder.recording || recorder.paused) ? <Square className="w-9 h-9 relative" fill="currentColor" /> : <Mic className="w-9 h-9 relative" />}
                </motion.button>

                <div className="text-3xl font-mono tabular-nums tracking-tight">
                  {fmtTime(recorder.elapsed)}
                </div>

                {recorder.recording && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {recorder.paused ? (
                      <>
                        <Button size="sm" variant="default" onClick={handleStop} className="bg-green-600 hover:bg-green-700">
                          <Square className="w-4 h-4" /> Detener
                        </Button>
                        <Button size="sm" variant="outline" onClick={recorder.resume}>
                          <Play className="w-4 h-4" /> Reanudar
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={recorder.pause}>
                        <Pause className="w-4 h-4" /> Pausar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { recorder.stop(); recorder.reset(); }}>
                      <RotateCcw className="w-4 h-4" /> Reiniciar
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  {recorder.recording
                    ? recorder.paused ? 'Pausado.' : 'Escuchando… habla con claridad.'
                    : 'Pulsa el micrófono para empezar. Se guardará el audio y la transcripción.'}
                </p>
              </div>

              {(recorder.transcript || recorder.interim) && (
                <div className="glass rounded-xl p-4 max-h-48 overflow-y-auto text-sm leading-relaxed">
                  <span>{recorder.transcript}</span>
                  <span className="text-muted-foreground italic"> {recorder.interim}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ============ STAGE 2: REVIEW ============ */}
          {stage === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la nota" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" /> Resumen — 5 puntos editables
                  </label>
                  <button
                    onClick={regenerate}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Regenerar
                  </button>
                </div>

                <div className="space-y-2">
                  {bullets.map((b, i) => (
                    <div key={i} className="glass rounded-xl p-2.5 flex items-start gap-2 group">
                      <div className="flex flex-col gap-0.5 pt-1.5 text-muted-foreground">
                        <button onClick={() => moveBullet(i, -1)} className="hover:text-foreground" aria-label="Subir">
                          <GripVertical className="w-3.5 h-3.5 rotate-90" />
                        </button>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs grid place-items-center mt-0.5 shrink-0">
                        {i + 1}
                      </div>
                      <Textarea
                        value={b}
                        onChange={(e) => updateBullet(i, e.target.value)}
                        rows={2}
                        className="flex-1 min-h-0 resize-none bg-transparent border-0 focus-visible:ring-0 px-1 py-0.5 text-sm"
                      />
                      <button
                        onClick={() => removeBullet(i)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Eliminar punto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addBullet} className="w-full">
                    <Plus className="w-4 h-4" /> Añadir punto
                  </Button>
                </div>
              </div>

              <details className="glass rounded-xl p-3">
                <summary className="cursor-pointer text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  <span>Transcripción completa ({wordCount} palabras)</span>
                  <span className="text-accent">editar</span>
                </summary>
                <Textarea
                  value={editableTranscript}
                  onChange={(e) => setEditableTranscript(e.target.value)}
                  rows={8}
                  className="mt-3 text-sm"
                />
              </details>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Tags</label>
                <Input
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  placeholder="voz, idea, reunión..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { setStage('record'); recorder.reset(); }} className="flex-1">
                  Volver a grabar
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-gradient-primary text-primary-foreground">
                  <Save className="w-4 h-4" /> Guardar en Biblioteca
                </Button>
              </div>
            </motion.div>
          )}

          {/* ============ STAGE 3: SAVED CONFIRM - OPTIONS ============ */}
          {stage === 'saved-confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="glass rounded-2xl p-5 text-sm space-y-3">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Guardado en tu Biblioteca</span>
                </div>
                <p className="text-muted-foreground">
                  Tu resumen y transcripción ya están disponibles en la app.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción 1: Descargar audio */}
                <button
                  onClick={downloadAudioOnly}
                  className="glass rounded-xl p-4 text-left hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 grid place-items-center group-hover:scale-110 transition">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">Descargar audio</div>
                      <div className="text-xs text-muted-foreground">Archivo .mp3</div>
                    </div>
                  </div>
                </button>

                {/* Opción 2: Descargar resumen markdown */}
                <button
                  onClick={downloadMarkdown}
                  className="glass rounded-xl p-4 text-left hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-500 grid place-items-center group-hover:scale-110 transition">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">Descargar resumen</div>
                      <div className="text-xs text-muted-foreground">Archivo .md</div>
                    </div>
                  </div>
                </button>

                {/* Opción 3: Descargar todo */}
                <button
                  onClick={downloadEverything}
                  className="glass rounded-xl p-4 text-left hover:bg-muted/50 transition-colors group sm:col-span-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary text-primary-foreground grid place-items-center group-hover:scale-110 transition">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">Descargar todo</div>
                      <div className="text-xs text-muted-foreground">Audio (.mp3) + Resumen (.md)</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  <X className="w-4 h-4" /> Listo, cerrar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}