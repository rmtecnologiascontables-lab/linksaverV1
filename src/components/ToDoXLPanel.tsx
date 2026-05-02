import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListChecks, Plus, MoreVertical, Pencil, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTodoXLStore } from '@/store/todoXLSlice';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ToDoXLPanel({ open, onOpenChange }: Props) {
  const { items, addItem, updateItem, toggleItem, deleteItem, clearDone } = useTodoXLStore();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    addItem(draft);
    setDraft('');
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const commitEdit = () => {
    if (editingId && editingText.trim()) {
      updateItem(editingId, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  };

  const pending = items.filter((i) => !i.done).length;
  const doneCount = items.length - pending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <ListChecks className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-left">To Do XL</SheetTitle>
              <SheetDescription className="text-left text-xs">
                Quick notes accesibles desde cualquier sección.
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="Escribe una nota rápida y presiona Enter…"
              className="h-10"
              autoFocus
            />
            <Button
              onClick={submit}
              size="icon"
              className="bg-gradient-primary text-primary-foreground shrink-0"
              aria-label="Añadir"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
            <span>{pending} pendientes · {doneCount} hechas</span>
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                Limpiar hechas
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-14 px-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-muted grid place-items-center mb-3">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Sin notas todavía</p>
              <p className="text-xs text-muted-foreground mt-1">
                Captura ideas sin perder el contexto de lo que estás haciendo.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group glass rounded-xl p-3 flex items-start gap-2.5 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="mt-0.5 shrink-0"
                    aria-label={item.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 transition-colors ${
                        item.done ? 'text-primary fill-primary/20' : 'text-muted-foreground hover:text-primary'
                      }`}
                    />
                  </button>

                  {editingId === item.id ? (
                    <Input
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') { setEditingId(null); setEditingText(''); }
                      }}
                      className="h-7 text-sm flex-1"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(item.id, item.text)}
                      className={`flex-1 text-sm text-left leading-snug ${
                        item.done ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {item.text}
                    </button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-7 h-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ring-focus shrink-0"
                        aria-label="Acciones"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => startEdit(item.id, item.text)}>
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteItem(item.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
