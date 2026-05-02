import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Wrench, Sparkles, PackageOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToolkitStore } from '@/store/toolkitSlice';
import { ToolCard } from '@/components/Toolkit/ToolCard';
import { ToolFormModal } from '@/components/Toolkit/ToolFormModal';
import type { Tool } from '@/types/tool';
import { toast } from '@/hooks/use-toast';

export function ToolkitPage() {
  const { tools, categories, deleteTool, addCategory } = useToolkitStore();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCat, setNewCat] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      const matchCat = activeCat === 'all' || t.category === activeCat;
      const matchQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [tools, query, activeCat]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (t: Tool) => { setEditing(t); setOpen(true); };
  const onDelete = (id: string) => {
    deleteTool(id);
    toast({ title: 'Herramienta eliminada' });
  };

  const handleNewCategory = () => {
    const v = newCat.trim();
    if (!v) return;
    addCategory(v);
    setActiveCat(v);
    setNewCat('');
    setShowNewCat(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-5 md:p-6 border border-border/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-aurora opacity-50 pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight">
              ¿La app no puede procesarlo?
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Encuentra alternativas gratuitas aquí. Tu toolkit personal de apps externas para tareas que RM Brain aún no cubre.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Search + add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar herramientas, categorías…"
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} className="bg-gradient-primary text-primary-foreground shadow-glow hidden sm:inline-flex">
          <Plus className="w-4 h-4" /> Nueva herramienta
        </Button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        <ChipButton active={activeCat === 'all'} onClick={() => setActiveCat('all')}>
          <Sparkles className="w-3.5 h-3.5" /> Todas
        </ChipButton>
        {categories.map((c) => (
          <ChipButton key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>
            {c}
          </ChipButton>
        ))}
        {showNewCat ? (
          <div className="flex items-center gap-1 glass rounded-full pl-3 pr-1 py-1">
            <input
              autoFocus
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewCategory();
                if (e.key === 'Escape') { setShowNewCat(false); setNewCat(''); }
              }}
              placeholder="Nombre…"
              className="bg-transparent text-xs outline-none w-24"
            />
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={handleNewCategory}>
              OK
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewCat(true)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs glass border border-dashed border-border hover:border-primary text-muted-foreground hover:text-foreground transition-colors"
          >
            ➕ Nueva categoría
          </button>
        )}
      </div>

      {/* Grid / Empty */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl py-16 px-6 text-center border border-dashed border-border/60"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted grid place-items-center mb-4">
            <PackageOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">No hay herramientas que coincidan</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Prueba con otra búsqueda o categoría, o agrega la tuya propia.
          </p>
          <Button onClick={openNew} className="mt-5 bg-gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4" /> Añadir herramienta
          </Button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <ToolCard key={t.id} tool={t} onEdit={openEdit} onDelete={onDelete} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB mobile */}
      <button
        onClick={openNew}
        className="sm:hidden fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow grid place-items-center ring-focus"
        aria-label="Nueva herramienta"
      >
        <Plus className="w-6 h-6" />
      </button>

      <ToolFormModal open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: React.PropsWithChildren<{ active: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ring-focus ${
        active
          ? 'bg-gradient-primary text-primary-foreground shadow-glow'
          : 'glass text-muted-foreground hover:text-foreground border border-border/50'
      }`}
    >
      {children}
    </button>
  );
}
