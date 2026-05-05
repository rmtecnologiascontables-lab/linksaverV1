import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ResourceCard } from '@/components/ResourceCard';
import { ResourceDetail } from '@/components/ResourceDetail';
import type { Resource, ResourceType } from '@/types';

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
  const [filter, setFilter] = useState<ResourceType | 'all'>('all');
  const [detail, setDetail] = useState<Resource | null>(null);

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
          <ResourceCard key={r.id} resource={r} onClick={() => setDetail(r)} />
        ))}
      </div>

      <ResourceDetail resource={detail} onClose={() => setDetail(null)} onSendToStudio={onSendToStudio} />
    </div>
  );
}
