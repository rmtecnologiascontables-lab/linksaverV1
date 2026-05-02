import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mic, Square, Pause, Play, RotateCcw, Sparkles, Plus, Trash2,
  GripVertical, Save, Download, X,
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
  const [tagsRaw, setTagsRaw] = useState('voz, nota');
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
      recorder.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleStop = () => {
    const final = recorder.stop();
    const text = final || recorder.transcript;
    if (!text.trim()) {
      toast({ title: 'Sin audio', description: 'No se detectó voz. Intenta de nuevo.', variant: 'destructive' });
      return;
    }
    const t = autoTitle(text);
    setTitle(t);
    setDownloadTitle(t);
    setBullets(summarizeToBullets(text, 5));
    setEditableTranscript(text);
    setStage('review');
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
    // Marcamos ready inmediatamente (no hay pipeline async)
    markReady(id, summary);

    toast({ title: 'Guardado en tu Library', description: finalTitle });
    setStage('saved-confirm');
  };

  const buildDownloadBlob = () => {
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
      `_Generado por RM Brain · ${new Date().toLocaleString()}_`,
    ].filter((l) => l !== null).join('\n');
    return new Blob([lines], { type: 'text/markdown;charset=utf-8' });
  };

  const downloadFile = () => {
    const blob = buildDownloadBlob();
    const safe = (downloadTitle.trim() || title.trim() || 'nota-de-voz')
      .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${safe || 'nota-de-voz'}.md`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    toast({ title: 'Descargado', description: 'Archivo .md guardado en tu dispositivo.' });
    onClose();
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
            {stage === 'saved-confirm' && '¿Descargar también una copia?'}
          </DialogTitle>
          <DialogDescription>
            {stage === 'record' && 'El audio se procesa en tu navegador. No se guarda ningún archivo de audio.'}
            {stage === 'review' && 'Edita los 5 puntos clave, el título y la transcripción antes de guardar.'}
            {stage === 'saved-confirm' && 'Tu resumen ya está en la Library. ¿Quieres además bajarlo como archivo?'}
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
                  onClick={recorder.recording ? handleStop : recorder.start}
                  disabled={!recorder.supported}
                  whileTap={{ scale: 0.92 }}
                  className={`relative w-24 h-24 rounded-full grid place-items-center shadow-glow ring-focus disabled:opacity-50 ${
                    recorder.recording
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-gradient-primary text-primary-foreground'
                  }`}
                  aria-label={recorder.recording ? 'Detener' : 'Grabar'}
                >
                  {recorder.recording && !recorder.paused && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-destructive/40"
                      animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                  {recorder.recording ? <Square className="w-9 h-9 relative" fill="currentColor" /> : <Mic className="w-9 h-9 relative" />}
                </motion.button>

                <div className="text-3xl font-mono tabular-nums tracking-tight">
                  {fmtTime(recorder.elapsed)}
                </div>

                {recorder.recording && (
                  <div className="flex gap-2">
                    {recorder.paused ? (
                      <Button size="sm" variant="outline" onClick={recorder.resume}>
                        <Play className="w-4 h-4" /> Reanudar
                      </Button>
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
                    : 'Pulsa el micrófono para empezar. El audio NO se guarda — solo la transcripción y el resumen.'}
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
                <Button variant="outline" onClick={() => setStage('record')} className="flex-1">
                  Volver a grabar
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-gradient-primary text-primary-foreground">
                  <Save className="w-4 h-4" /> Guardar resumen
                </Button>
              </div>
            </motion.div>
          )}

          {/* ============ STAGE 3: ASK DOWNLOAD ============ */}
          {stage === 'saved-confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {!askedDownload ? (
                <>
                  <div className="glass rounded-2xl p-5 text-sm space-y-2">
                    <p>
                      Tu resumen y transcripción ya están guardados en la <strong>Library</strong> como recurso de audio.
                    </p>
                    <p className="text-muted-foreground">
                      El audio NO se conserva. Si quieres una copia local (resumen + transcripción), descárgala como archivo Markdown.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      <X className="w-4 h-4" /> No, descartar audio
                    </Button>
                    <Button
                      onClick={() => setAskedDownload(true)}
                      className="flex-1 bg-gradient-primary text-primary-foreground"
                    >
                      <Download className="w-4 h-4" /> Sí, descargar copia
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Título del archivo</label>
                    <Input
                      value={downloadTitle}
                      onChange={(e) => setDownloadTitle(e.target.value)}
                      placeholder="Mi nota de voz"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Descripción (opcional)</label>
                    <Textarea
                      value={downloadDescription}
                      onChange={(e) => setDownloadDescription(e.target.value)}
                      rows={3}
                      placeholder="Contexto, fecha, participantes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAskedDownload(false)} className="flex-1">
                      Atrás
                    </Button>
                    <Button onClick={downloadFile} className="flex-1 bg-gradient-primary text-primary-foreground">
                      <Download className="w-4 h-4" /> Descargar .md
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
