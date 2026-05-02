import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ContextCard } from '@/components/ContextCards';

interface PromptContextState {
  contextCards: ContextCard[];
  setContextCards: (cards: ContextCard[]) => void;
  addContextCard: (card: ContextCard) => void;
  removeContextCard: (id: string) => void;
  updateContextCard: (id: string, card: Partial<ContextCard>) => void;
}

export const usePromptContextStore = create<PromptContextState>()(
  persist(
    (set) => ({
      contextCards: [],
      setContextCards: (cards) => set({ contextCards: cards }),
      addContextCard: (card) =>
        set((state) => ({
          contextCards: state.contextCards.length < 5
            ? [...state.contextCards, card]
            : state.contextCards,
        })),
      removeContextCard: (id) =>
        set((state) => ({
          contextCards: state.contextCards.filter((c) => c.id !== id),
        })),
      updateContextCard: (id, patch) =>
        set((state) => ({
          contextCards: state.contextCards.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
    }),
    {
      name: 'rm-brain-prompt-context',
    },
  ),
);