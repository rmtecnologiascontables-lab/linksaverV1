import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Wand2, ExternalLink, Sparkles, Loader2, Save, RotateCcw, Brain, CheckCircle } from 'lucide-react';
import type { Resource } from '@/types';
import { typeMeta } from '@/lib/typeMeta';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { extractContentFromUrl, fetchHtmlWithProxy, type ContentSection } from '@/lib/contentExtractor';
import { SectionReader } from './SectionReader';

interface Props {
  resource: Resource | null;
  onClose: () => void;
  onSendToStudio?: (id: string) => void;
}

export function ResourceDetail({ resource, onClose, onSendToStudio }: Props) {
  const deleteResource = useStore((s) => s.deleteResource);
  const updateResource = useStore((s) => s.updateResource);
  const toggleProcessed = useStore((s) => s.toggleProcessed);
  const [extractedSections, setExtractedSections] = useState<ContentSection[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setExtractedSections([]);
    setHasChanges(false);
  }, [resource?.id]);

  useEffect(() => {
    if (resource?.aiSummary?.includes('Secciones extraídas:')) {
      const match = resource.aiSummary.match(/Secciones extraídas: (\d+)/);
      if (match) {
        toast.info('Este recurso ya tiene un escaneo guardado');
      }
    }
  }, [resource]);

  const handleSaveScan = () => {
    if (!resource || extractedSections.length === 0) return;
    
    const summary = `Secciones extraídas: ${extractedSections.length}\n\n${extractedSections.map(s => `• ${s.title}: ${s.preview}`).join('\n')}`;
    updateResource(resource.id, { aiSummary: summary });
    setHasChanges(false);
    toast.success('Escaneo guardado en el recurso');
  };

  const handleDiscardScan = () => {
    setExtractedSections([]);
    setHasChanges(false);
    toast.info('Escaneo descartado');
  };

  const handleExtractContent = async () => {
    if (!resource?.url) {
      toast.error('URL no disponible para extraer contenido');
      return;
    }

    setIsExtracting(true);
    try {
      const html = await fetchHtmlWithProxy(resource.url);
      const sections = await extractContentFromUrl(html, resource.url);
      if (sections.length > 0) {
        setExtractedSections(sections);
        setHasChanges(true);
        toast.success(`${sections.length} secciones detectadas`);
      } else {
        toast.error('No se pudo extraer contenido de esta URL');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Error al extraer contenido. Intenta con otra URL.');
    } finally {
      setIsExtracting(false);
    }
  };

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
            className="fixed inset-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] md:max-w-[90vw] z-50 glass-strong rounded-3xl shadow-elegant max-h-[90vh] flex flex-col overflow-hidden"
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[60vh]">
              {resource.url && (
                <div className="space-y-3">
                  <a href={resource.url} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-glow break-all">
                    <ExternalLink className="w-3.5 h-3.5" /> {resource.url}
                  </a>
                  <button
                    onClick={handleExtractContent}
                    disabled={isExtracting}
                    className="w-full h-9 rounded-lg bg-[#111] border border-[#222] text-xs text-[#888] hover:text-white hover:border-[#333] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isExtracting ? 'Extrayendo contenido...' : 'Extraer secciones leggibles'}
                  </button>
                </div>
              )}

              {extractedSections.length > 0 && (
                <>
                  <SectionReader sections={extractedSections} />
                  {hasChanges && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveScan}
                        className="flex-1 h-9 rounded-lg bg-green-600/20 border border-green-600/50 text-green-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-green-600/30 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Guardar
                      </button>
                      <button
                        onClick={handleDiscardScan}
                        className="h-9 px-3 rounded-lg glass border border-border text-muted-foreground text-xs flex items-center gap-1.5 hover:text-foreground transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Descartar
                      </button>
                    </div>
                  )}
                </>
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
              <button
                onClick={() => {
                  toggleProcessed(resource.id);
                  toast.success(resource.processed ? 'Removido del cerebro' : 'Agregado al cerebro');
                }}
                className={`h-11 px-4 rounded-xl glass flex items-center gap-2 ring-focus ${
                  resource.processed
                    ? 'text-green-600 hover:bg-green-500/10'
                    : 'text-primary hover:bg-primary/10'
                }`}
              >
                {resource.processed ? <CheckCircle className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                {resource.processed ? 'En Cerebro' : 'Agregar al Cerebro'}
              </button>
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
