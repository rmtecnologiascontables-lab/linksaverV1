import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Trash2, Plus, X, Check, FileText, Brain } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ResourceCard } from '@/components/ResourceCard';
import { toast } from 'sonner';
import type { Resource, ResourceType } from '@/types';

export function ProjectsPage({ onSendToStudio }: { onSendToStudio?: (id: string) => void }) {
  const projects = useStore((s) => s.projects);
  const resources = useStore((s) => s.resources);
  const addProject = useStore((s) => s.addProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const removeResourceFromProject = useStore((s) => s.removeResourceFromProject);
  const addResourceToProject = useStore((s) => s.addResourceToProject);

  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFilter, setImportFilter] = useState<ResourceType | 'all'>('all');
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
      setShowCreateForm(false);
      toast.success('Proyecto creado');
    }
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    if (selectedProject === id) setSelectedProject(null);
    toast.success('Proyecto eliminado');
  };

  const handleImportResources = () => {
    if (!selectedProject) return;

    selectedResources.forEach(resourceId => {
      addResourceToProject(selectedProject, resourceId);
    });
    setSelectedResources(new Set());
    setShowImportModal(false);
    toast.success(`${selectedResources.size} recurso(s) agregado(s) al proyecto`);
  };

  const projectResources = selectedProject
    ? projects.find(p => p.id === selectedProject)?.resourceIds.map(id => resources.find(r => r.id === id)).filter(Boolean) || []
    : [];

  // Get resources available for import (not already in current project)
  const availableResources = selectedProject
    ? resources.filter(r => !projects.find(p => p.id === selectedProject)?.resourceIds.includes(r.id))
    : [];

  // Filter available resources by type
  const filteredAvailableResources = importFilter === 'all'
    ? availableResources
    : availableResources.filter(r => r.type === importFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground mt-1">Agrupa tus recursos por objetivos o clientes</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow"
        >
          <FolderPlus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      </div>

      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 flex gap-3 items-center"
        >
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Nombre del proyecto..."
            className="flex-1 bg-input/60 border border-border rounded-xl px-4 py-2"
            autoFocus
          />
          <button
            onClick={handleCreateProject}
            disabled={!newProjectName.trim()}
            className="px-4 py-2 bg-gradient-primary text-primary-foreground rounded-xl disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowCreateForm(false); setNewProjectName(''); }}
            className="p-2 hover:bg-muted rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {projects.length === 0 && !showCreateForm ? (
        <div className="text-center py-16 glass rounded-3xl">
          <FolderPlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay proyectos aún</h3>
          <p className="text-muted-foreground mb-4">Crea tu primer proyecto para organizar tus recursos</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-primary hover:underline"
          >
            Crear proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Tus Proyectos ({projects.length})
            </h2>
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedProject === project.id
                      ? 'border-primary bg-primary/10'
                      : 'glass hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.resourceIds.length} recursos
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                      className="p-2 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedProject ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Recursos en "{projects.find(p => p.id === selectedProject)?.name}"
                  </h2>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:opacity-90 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar recursos
                  </button>
                </div>
                {projectResources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectResources.map((r) => r && (
                      <div key={r.id} className="relative group">
                        <ResourceCard 
                          resource={r} 
                          onClick={() => onSendToStudio?.(r.id)}
                          onDelete={() => {
                            if (confirm('¿Eliminar este recurso del proyecto?')) {
                              removeResourceFromProject(selectedProject, r.id);
                              toast.success('Recurso removido del proyecto');
                            }
                          }}
                        />
                        <button
                          onClick={() => removeResourceFromProject(selectedProject, r.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition"
                          title="Quitar del proyecto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                 ) : (
                  <div className="text-center py-12 glass rounded-2xl">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Este proyecto no tiene recursos</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Asigna recursos desde "Añadir recurso" o la Biblioteca
                    </p>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:opacity-90 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Traer recursos
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full glass rounded-3xl">
                <p className="text-muted-foreground">Selecciona un proyecto para ver sus recursos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Resources Modal */}
      <AnimatePresence>
        {showImportModal && selectedProject && (
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
                  <Plus className="w-5 h-5" /> Agregar recursos al proyecto
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona recursos para agregar a "{projects.find(p => p.id === selectedProject)?.name}"
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
                          <Check className="w-4 h-4 text-primary" />
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
                        {r.processed && (
                          <div className="flex items-center gap-1 mt-2">
                            <Brain className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-primary">En colección personal</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {filteredAvailableResources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay recursos disponibles para agregar</p>
                <p className="text-sm">Todos los recursos ya están en este proyecto</p>
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