import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/authSlice';
import { saveResource } from '@/lib/googleSheetsDB';
import type { ResourceType } from '@/types';
import { toast } from 'sonner';

interface Props { open: boolean; onClose: () => void; }

const types: { value: ResourceType; label: string }[] = [
  { value: 'link',  label: 'Link' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'note',  label: 'Nota' },
];

export function AddResourceSheet({ open, onClose }: Props) {
  const addResource = useStore((s) => s.addResource);
  const markReady = useStore((s) => s.markReady);
  const user = useAuthStore((s) => s.user);

  const [type, setType] = useState<ResourceType>('link');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const reset = () => { setType('link'); setUrl(''); setTitle(''); setTagsInput(''); setNote(''); setProcessing(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Falta el título'); return; }
    setProcessing(true);
    
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    
    // 1. Guardar en store local (siempre funciona)
    const id = addResource({ type, url: url || undefined, title, tags, note: note || undefined });

    // 2. Guardar en Google Sheets (si el usuario está logueado)
    let aiSummary = '';
    if (user?.email) {
      try {
        const savedToSheets = await saveResource({
          type,
          url: url || undefined,
          title,
          tags,
          note: note || undefined,
          userEmail: user.email,
          createdAt: new Date().toISOString(),
          status: 'processing',
        });
        
        if (savedToSheets) {
          console.log('✅ Recurso guardado en Google Sheets');
        } else {
          console.log('⚠️ No se guardó en Sheets (pero OK localmente)');
        }
      } catch (error) {
        console.error('Error guardando en Sheets:', error);
      }
    } else {
      console.log('ℹ️ Usuario no logueado, solo se guarda localmente');
    }

    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 1600));
    aiSummary = `Resumen IA generado automáticamente para "${title}". Puntos clave detectados y vinculados a tu perfil.`;
    markReady(id, aiSummary);
    
    toast.success('Recurso añadido y procesado');
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] z-50 glass-strong md:border-l border-border rounded-t-3xl md:rounded-none shadow-elegant flex flex-col max-h-[92vh]"
            role="dialog" aria-modal="true" aria-label="Añadir recurso"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div>
                <h2 className="font-semibold text-lg">Añadir recurso</h2>
                <p className="text-xs text-muted-foreground">Se procesará con IA al guardar</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full glass grid place-items-center ring-focus" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Tipo</label>
                <div className="grid grid-cols-4 gap-2">
                  {types.map((t) => (
                    <button
                      type="button" key={t.value} onClick={() => setType(t.value)}
                      className={`py-2.5 rounded-xl text-sm transition-all ring-focus ${type === t.value ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              {type !== 'note' && (
                <Field label="URL">
                  <input
                    type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus"
                  />
                </Field>
              )}

              <Field label="Título *">
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder="Dale un título descriptivo"
                  className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus"
                />
              </Field>

              <Field label="Tags (separadas por coma)">
                <input
                  value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="IA, Frontend, Productividad"
                  className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus"
                />
              </Field>

              <Field label="Notas personales">
                <textarea
                  value={note} onChange={(e) => setNote(e.target.value)} rows={4}
                  placeholder="¿Por qué te interesa? ¿Cómo lo usarás?"
                  className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus resize-none"
                />
              </Field>
            </form>

            <div className="p-5 border-t border-border/50">
              <button
                onClick={handleSubmit as any} disabled={processing}
                className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 shadow-glow disabled:opacity-60 ring-focus"
              >
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando con IA...</> : <><Sparkles className="w-4 h-4" /> Guardar y procesar</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">{label}</label>
      {children}
    </div>
  );
}
