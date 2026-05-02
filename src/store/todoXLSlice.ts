import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TodoXLItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

interface TodoXLState {
  items: TodoXLItem[];
  addItem: (text: string) => void;
  updateItem: (id: string, text: string) => void;
  toggleItem: (id: string) => void;
  deleteItem: (id: string) => void;
  clearDone: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useTodoXLStore = create<TodoXLState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (text) => {
        const t = text.trim();
        if (!t) return;
        set((s) => ({
          items: [
            { id: uid(), text: t, done: false, createdAt: new Date().toISOString() },
            ...s.items,
          ],
        }));
      },
      updateItem: (id, text) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, text } : i)),
        })),
      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),
      deleteItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clearDone: () =>
        set((s) => ({ items: s.items.filter((i) => !i.done) })),
    }),
    { name: 'rm-brain-todoxl', version: 1 },
  ),
);
