import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ResourceCard } from '@/components/ResourceCard';
import { ResourceDetail } from '@/components/ResourceDetail';
import type { Resource, ResourceType } from '@/types';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

interface Props { onSendToStudio: (id: string) => void; }

const filters: { value: ResourceType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'link', label: 'Links' },
  { value: 'ai', label: 'AI' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'note', label: 'Notas' },
];

export function LibraryPage({ onSendToStudio }: Props) {
  const resources = useStore((s) => s.resources);
  const deleteResource = useStore((s) => s.deleteResource);
  const projects = useStore((s) => s.projects);
  const addResourceToProject = useStore((s) => s.addResourceToProject);
  const [filter, setFilter] = useState<ResourceType | 'all'>('all');
  const [detail, setDetail] = useState<Resource | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedResourceForProject, setSelectedResourceForProject] = useState<Resource | null>(null);

  const filtered = filter === 'all' ? resources : resources.filter((r) => r.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Biblioteca</h1>
          <p className="text-muted-foreground text-sm">Todo tu conocimiento en un solo lugar.</p>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-xl text-sm transition-all ring-focus ${filter === f.value ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      </div>

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
