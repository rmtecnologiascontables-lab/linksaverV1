import { Link2, Video, Mic, StickyNote, type LucideIcon } from 'lucide-react';
import type { ResourceType } from '@/types';

export const typeMeta: Record<ResourceType, { icon: LucideIcon; label: string; color: string }> = {
  link:  { icon: Link2,      label: 'Link',  color: 'text-accent' },
  video: { icon: Video,      label: 'Video', color: 'text-primary-glow' },
  audio: { icon: Mic,        label: 'Audio', color: 'text-success' },
  note:  { icon: StickyNote, label: 'Nota',  color: 'text-yellow-400' },
};
