import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Sparkles, Mic } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ResourceCard } from '@/components/ResourceCard';
import { AddResourceSheet } from '@/components/AddResourceSheet';
import { ResourceDetail } from '@/components/ResourceDetail';
import { VoiceRecorderModal } from '@/components/VoiceRecorderModal';
import type { Resource } from '@/types';

interface Props { onSendToStudio: (id: string) => void; }

export function Dashboard({ onSendToStudio }: Props) {
  const resources = useStore((s) => s.resources);
  const profile = useStore((s) => s.profile);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [detail, setDetail] = useState<Resource | null>(null);

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
      <section className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Hola, {profile.name.split(' ')[0]}
          </div>
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight max-w-2xl">
            Tu <span className="text-gradient">segundo cerebro</span> tiene{' '}
            <span className="text-gradient">{resources.length}</span> recursos listos para destilar.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Busca, filtra y envía cualquier combinación al Prompt Studio.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setRecording(true)}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow ring-focus hover:opacity-95 transition"
            >
              <Mic className="w-4 h-4" /> Grabar nota de voz
            </button>
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-full glass text-sm font-medium ring-focus hover:text-foreground"
            >
              <Plus className="w-4 h-4" /> Añadir recurso
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
              <ResourceCard key={r.id} resource={r} onClick={() => setDetail(r)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
