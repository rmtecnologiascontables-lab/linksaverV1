import { useState } from 'react';
import { Plus, X, Link2, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface ContextCard {
  id: string;
  title: string;
  url?: string;
  notes?: string;
}

interface Props {
  cards: ContextCard[];
  onChange: (cards: ContextCard[]) => void;
  maxCards?: number;
}

export function ContextCards({ cards, onChange, maxCards = 5 }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ContextCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const canAdd = cards.length < maxCards;

  const handleAdd = () => {
    if (!canAdd) return;
    setEditingCard({ id: '', title: '', url: '', notes: '' });
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleEdit = (card: ContextCard) => {
    setEditingCard({ ...card });
    setIsEditing(false);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!editingCard) return;
    if (isEditing) {
      onChange([...cards, { ...editingCard, id: Date.now().toString() }]);
    } else {
      onChange(cards.map((c) => (c.id === editingCard.id ? editingCard : c)));
    }
    setIsOpen(false);
    setEditingCard(null);
  };

  const handleDelete = (id: string) => {
    onChange(cards.filter((c) => c.id !== id));
  };

  const openLink = (url: string) => {
    if (url) window.open(url, '_blank');
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Tarjetas de contexto ({cards.length}/{maxCards})
          </span>
          {canAdd && (
            <button
              onClick={handleAdd}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Agregar
            </button>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Sin tarjetas de contexto. Agrega enlaces y notas para enricher el prompt.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="glass rounded-2xl p-4 space-y-2 group relative"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm truncate flex-1">{card.title}</h4>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleEdit(card)}
                      className="p-1 rounded hover:bg-muted"
                      title="Editar"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-1 rounded hover:bg-muted"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>

                {card.url && (
                  <button
                    onClick={() => openLink(card.url)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Link2 className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{card.url}</span>
                  </button>
                )}

                {card.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{card.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>{isEditing ? 'Agregar Tarjeta de Contexto' : 'Editar Tarjeta de Contexto'}</DialogTitle>
          <DialogDescription>
            Agrega un enlace y notas que el asistente analizará para crear mejores prompts.
          </DialogDescription>

          {editingCard && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <Input
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  placeholder="Ej: Artículo sobre IA"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">URL (opcional)</label>
                <Input
                  value={editingCard.url || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, url: e.target.value })}
                  placeholder="https://ejemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Notas (opcional)</label>
                <Textarea
                  value={editingCard.notes || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, notes: e.target.value })}
                  placeholder="Notas o contexto adicional..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} className="flex-1">
                  {isEditing ? 'Agregar' : 'Guardar'}
                </Button>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}