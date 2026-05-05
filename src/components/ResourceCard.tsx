import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Copy, Check, Sparkles, Trash2, Pencil, FolderPlus } from 'lucide-react';
import type { Resource } from '@/types';
import { typeMeta } from '@/lib/typeMeta';

interface Props {
  resource: Resource;
  onClick?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  onSaveAsLearning?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onAddToProject?: (resource: Resource) => void;
}

export function ResourceCard({ resource, onClick, selected, onToggleSelect, onSaveAsLearning, onDelete, onEdit, onAddToProject }: Props) {
  const meta = typeMeta[resource.type];
  const Icon = meta.icon;
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const urlToCopy = resource.url || '';
    if (urlToCopy) {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative"
    >
      <button
        onClick={onClick}
        className="w-full text-left glass rounded-2xl p-4 ring-focus hover:border-primary/40 transition-all hover:shadow-glow"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl glass grid place-items-center ${meta.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            {resource.status === 'processing' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary-glow border border-primary/30">
                <Loader2 className="w-3 h-3 animate-spin" /> Procesando
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-success/15 text-success border border-success/30">
                Listo
              </span>
            )}
            {resource.url && (
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg glass hover:bg-primary/20 hover:border-primary/40 transition-all"
                title="Copiar enlace"
                aria-label="Copiar enlace"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            )}
            {onSaveAsLearning && resource.aiSummary && (
              <button
                onClick={(e) => { e.stopPropagation(); onSaveAsLearning(resource); }}
                className="p-1.5 rounded-lg glass hover:bg-accent/20 hover:border-accent/40 transition-all"
                title="Guardar como aprendizaje"
                aria-label="Guardar como aprendizaje"
              >
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            {onAddToProject && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToProject(resource); }}
                className="p-1.5 rounded-lg glass hover:bg-primary/20 hover:border-primary/40 transition-all"
                title="Agregar a proyecto"
                aria-label="Agregar a proyecto"
              >
                <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
                className="p-1.5 rounded-lg glass hover:bg-blue-500/20 hover:border-blue-500/40 transition-all"
                title="Editar recurso"
                aria-label="Editar recurso"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(resource); }}
                className="p-1.5 rounded-lg glass hover:bg-destructive/20 hover:border-destructive/40 transition-all"
                title="Eliminar recurso"
                aria-label="Eliminar recurso"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        </div>

        <h3 className="font-medium leading-snug line-clamp-2 mb-2">{resource.title}</h3>

        {resource.aiSummary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{resource.aiSummary}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {resource.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground border border-border">
              #{t}
            </span>
          ))}
        </div>
      </button>

      {onToggleSelect && (
        <label className="absolute top-3 left-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
            onClick={(e) => e.stopPropagation()}
            className="sr-only peer"
            aria-label={`Seleccionar ${resource.title}`}
          />
          <span className="block w-5 h-5 rounded-md border-2 border-border bg-background/80 peer-checked:bg-gradient-primary peer-checked:border-transparent transition-all" />
        </label>
      )}
    </motion.div>
  );
}
