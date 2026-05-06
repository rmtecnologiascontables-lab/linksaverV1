import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Sparkles, Mic } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ResourceCard } from '@/components/ResourceCard';
import { AddResourceSheet } from '@/components/AddResourceSheet';
import { ResourceDetail } from '@/components/ResourceDetail';
import { VoiceRecorderModal } from '@/components/VoiceRecorderModal';
import { Checkbox } from '@/components/ui/checkbox';
import type { Resource } from '@/types';
import { toast } from 'sonner';

function OnboardingGuide({ onDismiss }: { onDismiss: (neverShowAgain: boolean) => void }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => onDismiss(dontShow), 500);
    }, 8000);
    return () => clearTimeout(timer);
  }, [dontShow, onDismiss]);

  const handleDismiss = () => {
    setFadeOut(true);
    setTimeout(() => onDismiss(dontShow), 500);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50"
        >
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />

          <svg
            className="absolute w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="arrowGradientNew" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(188, 86%, 53%)" />
                <stop offset="100%" stopColor="hsl(196, 94%, 48%)" />
              </linearGradient>
              <filter id="glowArrow">
                <feGaussianBlur stdDeviation="0.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 50 15 L 50 65 L 75 50"
              stroke="url(#arrowGradientNew)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowArrow)"
            />
          </svg>

          <div className="absolute bottom-32 md:bottom-16 right-6 md:right-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-primary shadow-glow animate-bounce flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-strong backdrop-blur-md rounded-2xl px-6 py-5 max-w-sm text-center pointer-events-auto border border-primary/20">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-1"
            >
              ✕
            </button>
            <p className="text-base font-semibold text-foreground mb-1">
              ¡Bienvenido a <span className="text-primary">RM Brain</span>!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="text-primary font-bold">Toca el icono (+)</span> para crear tu primer recurso.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="dont-show-again"
                checked={dontShow}
                onCheckedChange={(checked) => setDontShow(checked === true)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="dont-show-again"
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                No volver a mostrar
              </label>
            </div>

            <p className="text-xs text-muted-foreground/70">
              Haz clic en ✕ para cerrar
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface Props { onSendToStudio: (id: string) => void; }

export function Dashboard({ onSendToStudio }: Props) {
  const resources = useStore((s) => s.resources);
  const profile = useStore((s) => s.profile);
  const deleteResource = useStore((s) => s.deleteResource);
  const projects = useStore((s) => s.projects);
  const addResourceToProject = useStore((s) => s.addResourceToProject);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [detail, setDetail] = useState<Resource | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedResourceForProject, setSelectedResourceForProject] = useState<Resource | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      const hideOnboarding = localStorage.getItem('rm_brain_hide_onboarding');
      return hideOnboarding !== 'true';
    }
    return true;
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 12);
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchQ = !query || r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.aiSummary?.toLowerCase().includes(query.toLowerCase());
      const matchTag = !activeTag || r.tags.includes(activeTag);
      return matchQ && matchTag;
    });
  }, [resources, query, activeTag]);

  return (
    <div className="space-y-8">
      <section className="glass-strong rounded-3xl p-4 md:p-5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Hola, {profile.name.split(' ')[0]}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">GUARDA Y ORGANIZA</span>
            <br />
            <span className="text-muted-foreground">tus enlaces al instante</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Y ÚSALOS PARA CREAR</span>
            <br />
            <span className="text-muted-foreground text-2xl md:text-3xl">contenido o publicación</span>
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setRecording(true)}
              className="inline-flex items-center gap-2 px-5 h-12 rounded-full bg-gradient-primary text-primary-foreground text-base font-semibold shadow-glow ring-focus hover:opacity-95 transition"
            >
              <Mic className="w-5 h-5" /> Grabar nota de voz
            </button>
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 px-5 h-12 rounded-full glass text-base font-semibold ring-focus hover:text-foreground"
            >
              <Plus className="w-5 h-5" /> Añadir recurso
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tu cerebro..."
            className="w-full glass rounded-2xl pl-11 pr-4 h-12 text-sm ring-focus"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip active={activeTag === null} onClick={() => setActiveTag(null)}>Todos</Chip>
          {allTags.map((t) => (
            <Chip key={t} active={activeTag === t} onClick={() => setActiveTag(activeTag === t ? null : t)}>
              #{t}
            </Chip>
          ))}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass rounded-3xl p-10 text-center text-muted-foreground"
          >
            No hay recursos que coincidan. Prueba a quitar filtros.
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <ResourceCard 
                key={r.id} 
                resource={r} 
                onClick={() => setDetail(r)}
                onDelete={() => {
                  if (confirm('¿Eliminar este recurso?')) {
                    deleteResource(r.id);
                    toast.success('Recurso eliminado');
                  }
                }}
                onAddToProject={(res) => {
                  setSelectedResourceForProject(res);
                  setShowProjectSelector(true);
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showOnboarding && (
        <OnboardingGuide 
          onDismiss={(neverShowAgain) => { 
            setShowOnboarding(false); 
            if (neverShowAgain) {
              localStorage.setItem('rm_brain_hide_onboarding', 'true');
            }
          }} 
        />
      )}

      <button
        onClick={() => setAdding(true)}
        className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-30 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow animate-pulse-glow ring-focus"
        aria-label="Añadir recurso"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddResourceSheet open={adding} onClose={() => setAdding(false)} />
      <VoiceRecorderModal open={recording} onClose={() => setRecording(false)} />
      <ResourceDetail resource={detail} onClose={() => setDetail(null)} onSendToStudio={onSendToStudio} />

      <AnimatePresence>
        {showProjectSelector && selectedResourceForProject && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProjectSelector(false)}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="relative glass-strong rounded-2xl p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                Agregar a proyecto
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona un proyecto para "{selectedResourceForProject.title}"
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay proyectos. Crea uno primero.
                  </p>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addResourceToProject(p.id, selectedResourceForProject.id);
                        toast.success(`Agregado a "${p.name}"`);
                        setShowProjectSelector(false);
                        setSelectedResourceForProject(null);
                      }}
                      className="w-full text-left p-3 rounded-xl glass hover:bg-primary/10 border border-transparent hover:border-primary/40 transition-all"
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { setShowProjectSelector(false); setSelectedResourceForProject(null); }}
                className="w-full mt-4 p-2 rounded-xl glass text-sm"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ active, onClick, children }: React.PropsWithChildren<{ active: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ring-focus ${active ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}
