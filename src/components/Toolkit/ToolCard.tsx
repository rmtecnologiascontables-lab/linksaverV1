import { motion } from 'framer-motion';
import { MoreVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ToolIcon } from './ToolIcon';
import type { Tool } from '@/types/tool';

interface Props {
  tool: Tool;
  onEdit: (t: Tool) => void;
  onDelete: (id: string) => void;
}

export function ToolCard({ tool, onEdit, onDelete }: Props) {
  const open = () => window.open(tool.url, '_blank', 'noopener,noreferrer');
  let host = '';
  try { host = new URL(tool.url).hostname.replace('www.', ''); } catch { /* noop */ }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -2 }}
      className="group relative"
    >
      <button
        onClick={open}
        className="w-full glass rounded-2xl p-4 flex flex-col items-center gap-2.5 border border-border/50 hover:shadow-elegant hover:border-primary/40 transition-all ring-focus"
        aria-label={`Abrir ${tool.title}`}
      >
        <ToolIcon iconKey={tool.iconKey} fallbackUrl={tool.url} size={56} />
        <div className="w-full min-w-0 text-center">
          <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
            {tool.title}
          </h3>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {host}
          </p>
        </div>
      </button>

      {/* 3-dot menu — always available */}
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-full grid place-items-center bg-background/80 backdrop-blur border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ring-focus"
              aria-label="Acciones"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={open}>
              <ExternalLink className="w-4 h-4" /> Abrir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(tool)}>
              <Pencil className="w-4 h-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(tool.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
