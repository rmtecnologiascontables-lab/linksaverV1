import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileAudio, Loader2, Music, Trash2, Upload, X, CheckCircle2, AlertCircle, Link2, FileText, FileDown } from 'lucide-react';
import { useAudioConverter, type Bitrate, type ConversionItem } from '@/hooks/useAudioConverter';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ACCEPT = 'audio/*,video/*,.wav,.flac,.m4a,.ogg,.aac,.mp4,.mov,.mkv,.webm,.opus,.aiff,.wma';

export function ConverterPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [bitrate, setBitrate] = useState<Bitrate>('192k');
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlInputTranscribe, setUrlInputTranscribe] = useState('');
  const { items, convert, convertFromUrl, remove, clearAll, loadingCore, ready, validateFileSize } = useAudioConverter();

  const [transcribeItem, setTranscribeItem] = useState<ConversionItem | null>(null);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>(['', '', '', '', '']);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const validation = validateFileSize(files[i]);
      if (!validation.valid) {
        toast.error(validation.error);
      } else {
        validFiles.push(files[i]);
      }
    }
    if (validFiles.length > 0) {
      convert(validFiles, bitrate);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Ingresa una URL válida (comienza con http:// o https://)');
      return;
    }
    setUrlInput('');
    convertFromUrl(url, bitrate);
  };

  const transcribeAudio = async (item: ConversionItem) => {
    if (!item.url) return;
    setTranscribeItem(item);
    setIsTranscribing(true);
    setTranscription('');
    setSummary('');
    setKeyPoints(['', '', '', '', '']);

    try {
      const audio = new Audio(item.url);
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error('No se pudo cargar el audio'));
        audio.load();
      });

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Tu navegador no soporta transcripción de voz');
        setIsTranscribing(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      let fullTranscript = '';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Error al transcribir: ' + event.error);
      };

      recognition.onend = () => {
        setTranscription(fullTranscript.trim() || 'No se pudo detectar voz');
        setIsTranscribing(false);
        generateSummary(fullTranscript.trim());
      };

      recognition.start();
      audio.play();

      audio.onended = () => {
        setTimeout(() => recognition.stop(), 1000);
      };

    } catch (error) {
      toast.error('Error al procesar el audio');
      setIsTranscribing(false);
    }
  };

  const generateSummary = (text: string) => {
    if (!text) return;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      const preview = sentences.slice(0, 3).join('. ');
      setSummary(preview + '.');
    }
    setKeyPoints([
      'Punto clave 1 - Haz clic para editar',
      'Punto clave 2 - Haz clic para editar',
      'Punto clave 3 - Haz clic para editar',
      'Punto clave 4 - Haz clic para editar',
      'Punto clave 5 - Haz clic para editar',
    ]);
  };

  const downloadPDF = () => {
    if (!transcribeItem) return;
    const content = `
RM BRAIN - Transcripción de Audio
=================================

Archivo: ${transcribeItem.name}
Fecha: ${new Date().toLocaleDateString()}

--- TRANSCRIPCIÓN ---
${transcription}

--- RESUMEN ---
${summary}

--- PUNTOS CLAVE ---
${keyPoints.filter(p => p.trim()).map((p, i) => `${i + 1}. ${p}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcribeItem.name.replace(/\.[^.]+$/, '')}_transcripcion.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcripción descargada');
  };

  const copyToClipboard = () => {
    const text = `TRANSCRIPCIÓN:\n${transcription}\n\nRESUMEN:\n${summary}\n\nPUNTOS CLAVE:\n${keyPoints.filter(p => p.trim()).map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const transcribeFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInputTranscribe.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Ingresa una URL válida');
      return;
    }

    setTranscribeItem({ id: 'url-' + Date.now(), name: url.split('/').pop() || 'audio_url', outName: 'audio_url.mp3', size: 0, status: 'done', progress: 100, bitrate: '192k', isUrl: true, sourceUrl: url, url: '' });
    setIsTranscribing(true);
    setTranscription('');
    setSummary('');

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error('No se pudo cargar el audio'));
        audio.load();
      });

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Tu navegador no soporta transcripción de voz');
        setIsTranscribing(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      let fullTranscript = '';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Error al transcribir: ' + event.error);
      };

      recognition.onend = () => {
        setTranscription(fullTranscript.trim() || 'No se pudo detectar voz');
        setIsTranscribing(false);
        generateSummary(fullTranscript.trim());
      };

      recognition.start();
      audio.play();

      audio.onended = () => {
        setTimeout(() => recognition.stop(), 1000);
      };

    } catch (error) {
      toast.error('Error al descargar el audio desde la URL');
      setIsTranscribing(false);
    }
  };

  const downloadAll = () => {
    items.filter((i) => i.status === 'done' && i.url).forEach((i) => {
      const a = document.createElement('a');
      a.href = i.url!;
      a.download = i.outName;
      a.click();
    });
  };

  const fmt = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  };

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-8">
      <header className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <Music className="w-3.5 h-3.5 text-primary" /> Conversor universal
          </div>
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
            Convierte cualquier audio o video a <span className="text-gradient">MP3</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            WAV, FLAC, M4A, OGG, AAC, MP4, MOV, MKV y más. Procesamiento 100% local en tu navegador — tus archivos nunca salen de tu dispositivo.
          </p>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`glass rounded-3xl p-10 text-center cursor-pointer transition-all ring-focus ${dragOver ? 'border-primary scale-[1.01] shadow-glow' : 'hover:shadow-glow'}`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mb-4">
              <Upload className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="font-medium text-lg">Arrastra archivos o haz clic para seleccionar</div>
            <div className="text-sm text-muted-foreground mt-1">
              Soporta los formatos multimedia más populares (audio y video)
            </div>
{loadingCore && (
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground mt-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando motor de conversión…
              </div>
            )}
            {ready && !loadingCore && (
              <div className="text-xs text-success mt-4">Motor listo ✓</div>
            )}
          </div>

          <form onSubmit={handleUrlSubmit} className="mt-4 flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="URL de audio/video..."
              className="flex-1 h-10 px-3 rounded-lg border bg-background text-sm"
            />
            <button
              type="submit"
              disabled={!urlInput.trim() || !ready}
              className="h-10 px-4 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow ring-focus disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Link2 className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-border/60">
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Transcribir desde URL
            </label>
            <form onSubmit={transcribeFromUrl} className="flex gap-2">
              <input
                type="url"
                value={urlInputTranscribe}
                onChange={(e) => setUrlInputTranscribe(e.target.value)}
                placeholder="URL directa de audio..."
                className="flex-1 h-10 px-3 rounded-lg border bg-background text-sm"
              />
              <button
                type="submit"
                disabled={!urlInputTranscribe.trim()}
                className="h-10 px-4 rounded-lg bg-blue-500 text-white text-sm font-medium ring-focus disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[11px] text-muted-foreground mt-2">
              Pega la URL directa del archivo de audio (mp3, wav, etc.)
            </p>
          </div>
        </div>

        <aside className="glass rounded-3xl p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Calidad MP3</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['128k', '192k', '320k'] as Bitrate[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBitrate(b)}
                  className={`h-10 rounded-xl text-sm font-medium ring-focus transition ${bitrate === b ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}
                >
                  {b.replace('k', ' kbps')}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              192 kbps recomendado · 320 kbps máxima calidad
            </p>
          </div>

          <div className="pt-3 border-t border-border/60 space-y-2">
            <button
              disabled={doneCount === 0}
              onClick={downloadAll}
              className="w-full h-10 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow ring-focus disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Descargar todo ({doneCount})
            </button>
            <button
              disabled={items.length === 0}
              onClick={clearAll}
              className="w-full h-10 rounded-xl glass text-sm text-muted-foreground hover:text-foreground ring-focus disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Limpiar historial
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground pt-3 border-t border-border/60">
            🔒 Privacidad total: la conversión ocurre en tu navegador con WebAssembly. Ningún archivo se sube.
          </div>
        </aside>
      </section>

      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Historial</h2>
          <div className="space-y-2">
            {items.map((it) => (
              <motion.div
                layout
                key={it.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-primary/20 grid place-items-center shrink-0">
                  <FileAudio className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate text-sm">{it.outName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="truncate">{it.name}</span>
                    <span>·</span>
                    <span>{fmt(it.size)}</span>
                    <span>·</span>
                    <span>{it.bitrate.replace('k', ' kbps')}</span>
                  </div>
                  {(it.status === 'converting' || it.status === 'queued') && (
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary transition-all"
                        style={{ width: `${it.status === 'converting' ? it.progress : 4}%` }}
                      />
                    </div>
                  )}
                  {it.status === 'error' && (
                    <div className="text-xs text-destructive mt-1 inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {it.error}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {it.status === 'converting' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {it.status === 'done' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <button
                        onClick={() => transcribeAudio(it)}
                        className="h-9 px-3 rounded-lg bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 ring-focus"
                        title="Transcribir audio"
                      >
                        <FileText className="w-3.5 h-3.5" /> Transcribir
                      </button>
                      <a
                        href={it.url}
                        download={it.outName}
                        className="h-9 px-3 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 ring-focus shadow-glow"
                        title="Guardar en dispositivo"
                      >
                        <Download className="w-3.5 h-3.5" /> MP3
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => remove(it.id)}
                    className="w-9 h-9 rounded-lg glass grid place-items-center text-muted-foreground hover:text-destructive ring-focus"
                    aria-label="Desechar"
                    title="Desechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!transcribeItem} onOpenChange={(open) => !open && setTranscribeItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold">
            {transcribeItem?.name || 'Transcripción de Audio'}
          </DialogTitle>

          {isTranscribing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Transcribiendo audio...</p>
              <p className="text-xs text-muted-foreground mt-2">Asegúrate de que el navegador tenga permiso de micrófono si es necesario</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Transcripción</h3>
                <Textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder="La transcripción aparecerá aquí..."
                  className="min-h-[150px]"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Resumen</h3>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Resumen del contenido..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">5 Puntos Clave (editables)</h3>
                <div className="space-y-2">
                  {keyPoints.map((point, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-6">{i + 1}.</span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const newPoints = [...keyPoints];
                          newPoints[i] = e.target.value;
                          setKeyPoints(newPoints);
                        }}
                        placeholder={`Punto clave ${i + 1}`}
                        className="flex-1 h-9 px-3 rounded-lg border bg-background text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={copyToClipboard} className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Copiar todo
                </Button>
                <Button onClick={downloadPDF} variant="outline" className="flex-1">
                  <FileDown className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
                <Button onClick={() => { setTranscribeItem(null); setTranscription(''); setSummary(''); setKeyPoints(['', '', '', '', '']); }} variant="ghost">
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
