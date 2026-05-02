import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { Resource } from '@/types';
import { typeMeta } from '@/lib/typeMeta';

interface Props {
  resource: Resource;
  onClick?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function ResourceCard({ resource, onClick, selected, onToggleSelect }: Props) {
  const meta = typeMeta[resource.type];
  const Icon = meta.icon;

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
          {resource.status === 'processing' ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary-glow border border-primary/30">
              <Loader2 className="w-3 h-3 animate-spin" /> Procesando
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-success/15 text-success border border-success/30">
              Listo
            </span>
          )}
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
