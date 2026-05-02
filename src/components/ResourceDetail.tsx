import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Wand2, ExternalLink } from 'lucide-react';
import type { Resource } from '@/types';
import { typeMeta } from '@/lib/typeMeta';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface Props {
  resource: Resource | null;
  onClose: () => void;
  onSendToStudio?: (id: string) => void;
}

export function ResourceDetail({ resource, onClose, onSendToStudio }: Props) {
  const deleteResource = useStore((s) => s.deleteResource);

  return (
    <AnimatePresence>
      {resource && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] z-50 glass-strong rounded-3xl shadow-elegant max-h-[85vh] flex flex-col"
            role="dialog" aria-modal="true"
          >
            <div className="p-6 border-b border-border/50 flex items-start gap-4">
              {(() => {
                const Icon = typeMeta[resource.type].icon;
                return (
                  <div className={`w-12 h-12 rounded-xl glass grid place-items-center ${typeMeta[resource.type].color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{typeMeta[resource.type].label}</div>
                <h2 className="font-semibold text-lg leading-tight">{resource.title}</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full glass grid place-items-center ring-focus" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-glow break-all">
                  <ExternalLink className="w-3.5 h-3.5" /> {resource.url}
                </a>
              )}

              {resource.aiSummary && (
                <Section title="🧠 Resumen IA">
                  <p className="text-sm text-foreground/90 leading-relaxed">{resource.aiSummary}</p>
                </Section>
              )}

              {resource.note && (
                <Section title="📝 Notas">
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{resource.note}</p>
                </Section>
              )}

              <Section title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 border border-border">#{t}</span>
                  ))}
                </div>
              </Section>
            </div>

            <div className="p-5 border-t border-border/50 flex gap-2">
              {onSendToStudio && (
                <button
                  onClick={() => { onSendToStudio(resource.id); onClose(); }}
                  className="flex-1 h-11 rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 shadow-glow ring-focus"
                >
                  <Wand2 className="w-4 h-4" /> Usar en Prompt Studio
                </button>
              )}
              <button
                onClick={() => { deleteResource(resource.id); toast.success('Recurso eliminado'); onClose(); }}
                className="h-11 px-4 rounded-xl glass text-destructive hover:bg-destructive/10 flex items-center gap-2 ring-focus"
              >
                <Trash2 className="w-4 h-4" /> Borrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
