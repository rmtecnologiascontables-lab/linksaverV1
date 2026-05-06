import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Sparkles, Brain, CheckCircle, Plus, FolderPlus, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ResourceCard } from '@/components/ResourceCard';
import { ResourceDetail } from '@/components/ResourceDetail';
import { ResourceType } from '@/types';
import { toast } from 'sonner';
import type { Resource } from '@/types';

interface Props {
  onSendToStudio: (id: string) => void;
}

export function ContextualPage({ onSendToStudio }: Props) {
  const resources = useStore((s) => s.resources);
  const toggleProcessed = useStore((s) => s.toggleProcessed);
  const profile = useStore((s) => s.profile);
  const deleteResource = useStore((s) => s.deleteResource);
  const projects = useStore((s) => s.projects);
  const addResourceToProject = useStore((s) => s.addResourceToProject);

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [detail, setDetail] = useState<Resource | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedResourceForProject, setSelectedResourceForProject] = useState<Resource | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFilter, setImportFilter] = useState<ResourceType | 'all'>('all');
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());

  // Filter resources that are marked as processed
  const processedResources = useMemo(() => {
    return resources.filter((r) => r.processed === true);
  }, [resources]);

  // Further filter by search query and tag
  const filteredResources = useMemo(() => {
    return processedResources.filter((r) => {
      const matchQuery = !query ||
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.aiSummary?.toLowerCase().includes(query.toLowerCase()) ||
        r.note?.toLowerCase().includes(query.toLowerCase());

      const matchTag = !activeTag || r.tags.includes(activeTag);
      return matchQuery && matchTag;
    });
  }, [processedResources, query, activeTag]);

  // Get all tags from processed resources
  const allTags = useMemo(() => {
    const set = new Set<string>();
    processedResources.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 12);
  }, [processedResources]);

  // Get resources available for import (not processed)
  const availableResources = useMemo(() => {
    return resources.filter((r) => !r.processed);
  }, [resources]);

  // Filter available resources by type
  const filteredAvailableResources = useMemo(() => {
    return importFilter === 'all' ? availableResources : availableResources.filter((r) => r.type === importFilter);
  }, [availableResources, importFilter]);

  // Handle importing selected resources
  const handleImportResources = () => {
    selectedResources.forEach(resourceId => {
      toggleProcessed(resourceId);
    });
    setSelectedResources(new Set());
    setShowImportModal(false);
    toast.success(`${selectedResources.size} recurso(s) agregado(s) a tu colección`);
  };

  // Handle sending resource to project
  const handleSendToProject = (resource: Resource) => {
    setSelectedResourceForProject(resource);
    setShowProjectSelector(true);
  };

  return (
    <div className="space-y-8">
      <section className="glass-strong rounded-3xl p-4 md:p-5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
            <Brain className="w-3.5 h-3.5 text-primary" /> RM Brain Contextual AI
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">MI COLECCIÓN</span>
            <br />
            <span className="text-muted-foreground">PERSONAL</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">RECURSOS GESTIONADOS</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Aquí encuentras los recursos que has procesado, editado o marcado como importantes.
            Reanaliza, agrega notas o genera contenido con ellos.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{processedResources.length} recursos procesados</span>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="h-10 px-4 rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center gap-2 shadow-glow ring-focus hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Traer recursos
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tu colección personal..."
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
        {filteredResources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-3xl p-10 text-center text-muted-foreground"
          >
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Tu colección está vacía</h3>
            <p className="mb-6">
              {processedResources.length === 0
                ? "Aún no has marcado ningún recurso como procesado. Ve a la Biblioteca y marca los recursos que consideres importantes."
                : "No hay recursos que coincidan con tu búsqueda. Prueba con otros filtros."
              }
            </p>
            {processedResources.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Usa el checkbox ✓ en las tarjetas de la Biblioteca para agregar recursos aquí.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onClick={() => setDetail(r)}
                onToggleProcessed={() => toggleProcessed(r.id)}
                onDelete={() => {
                  if (confirm('¿Eliminar este recurso de tu colección?')) {
                    deleteResource(r.id);
                  }
                }}
                onAddToProject={(res) => handleSendToProject(res)}
                showProcessedBadge={true}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ResourceDetail resource={detail} onClose={() => setDetail(null)} onSendToStudio={onSendToStudio} />

      <AnimatePresence>
        {showProjectSelector && selectedResourceForProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProjectSelector(false)}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
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

      {/* Import Resources Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImportModal(false)}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass-strong rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Traer recursos a tu colección
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecciona los recursos que quieres agregar a tu colección personal
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 rounded-lg glass hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'link', label: 'Links' },
                  { value: 'video', label: 'Videos' },
                  { value: 'audio', label: 'Audio' },
                  { value: 'note', label: 'Notas' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setImportFilter(f.value as ResourceType | 'all')}
                    className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all ring-focus ${
                      importFilter === f.value
                        ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                        : 'glass text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredAvailableResources.map((r) => (
                  <div key={r.id} className="relative">
                    <button
                      onClick={() => {
                        const newSelected = new Set(selectedResources);
                        if (newSelected.has(r.id)) {
                          newSelected.delete(r.id);
                        } else {
                          newSelected.add(r.id);
                        }
                        setSelectedResources(newSelected);
                      }}
                      className={`w-full text-left glass rounded-xl p-4 ring-focus transition-all ${
                        selectedResources.has(r.id)
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg glass grid place-items-center flex-shrink-0 ${
                          selectedResources.has(r.id) ? 'bg-primary/20' : 'bg-muted/50'
                        }`}>
                          {selectedResources.has(r.id) ? (
                            <CheckCircle className="w-4 h-4 text-primary" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{r.title}</h4>
                          {r.aiSummary && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.aiSummary}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/60">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {filteredAvailableResources.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay recursos disponibles para importar</p>
                  <p className="text-sm">Todos los recursos ya están en tu colección</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 h-11 rounded-xl glass hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportResources}
                  disabled={selectedResources.size === 0}
                  className="flex-1 h-11 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow ring-focus disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar {selectedResources.size} recurso{selectedResources.size !== 1 ? 's' : ''}
                </button>
              </div>
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