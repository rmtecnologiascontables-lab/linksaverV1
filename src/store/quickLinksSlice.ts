import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type QuickLink, DEFAULT_LINKS } from '@/components/QuickLinks';

interface QuickLinksState {
  links: QuickLink[];
  setLinks: (links: QuickLink[]) => void;
}

export const useQuickLinksStore = create<QuickLinksState>()(
  persist(
    (set) => ({
      links: DEFAULT_LINKS,
      setLinks: (links) => set({ links }),
    }),
    {
      name: 'rm-brain-quicklinks',
    },
  ),
);