import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Trash2, Plus, X, Check, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ResourceCard } from '@/components/ResourceCard';
import { toast } from 'sonner';

export function ProjectsPage({ onSendToStudio }: { onSendToStudio?: (id: string) => void }) {
  const projects = useStore((s) => s.projects);
  const resources = useStore((s) => s.resources);
  const addProject = useStore((s) => s.addProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const removeResourceFromProject = useStore((s) => s.removeResourceFromProject);

  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const projectResources = selectedProject 
    ? projects.find(p => p.id === selectedProject)?.resourceIds.map(id => resources.find(r => r.id === id)).filter(Boolean) || []
    : [];

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
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Recursos en "{projects.find(p => p.id === selectedProject)?.name}"
                </h2>
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
                    <p className="text-sm text-muted-foreground mt-1">
                      Asigna recursos desde "Añadir recurso" o la Biblioteca
                    </p>
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
    </div>
  );
}