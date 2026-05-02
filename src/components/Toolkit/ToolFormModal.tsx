import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToolkitStore } from '@/store/toolkitSlice';
import type { Tool, ToolIconKey } from '@/types/tool';
import { ToolIcon, TOOL_ICON_OPTIONS } from './ToolIcon';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Tool | null;
}

export function ToolFormModal({ open, onOpenChange, editing }: Props) {
  const { categories, addTool, updateTool, addCategory } = useToolkitStore();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [newCat, setNewCat] = useState('');
  const [iconKey, setIconKey] = useState<ToolIconKey | ''>('');

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '');
      setUrl(editing?.url ?? '');
      setCategory(editing?.category ?? categories[0] ?? '');
      setDescription(editing?.description ?? '');
      setIconKey((editing?.iconKey as ToolIconKey) ?? '');
      setNewCat('');
    }
  }, [open, editing, categories]);

  const submit = () => {
    if (!title.trim() || !url.trim() || !category.trim()) {
      toast({ title: 'Faltan campos', description: 'Completa título, URL y categoría.' });
      return;
    }
    try {
      new URL(url);
    } catch {
      toast({ title: 'URL inválida', description: 'Incluye https://' });
      return;
    }
    const payload = {
      title: title.trim(),
      url: url.trim(),
      category,
      description: description.trim(),
      iconKey: iconKey || undefined,
    };
    if (editing) {
      updateTool(editing.id, payload);
      toast({ title: 'Herramienta actualizada' });
    } else {
      addTool(payload);
      toast({ title: 'Herramienta añadida' });
    }
    onOpenChange(false);
  };

  const handleAddCategory = () => {
    const v = newCat.trim();
    if (!v) return;
    addCategory(v);
    setCategory(v);
    setNewCat('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/60 max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar herramienta' : 'Nueva herramienta'}</DialogTitle>
          <DialogDescription>
            Guarda apps externas que usas como respaldo cuando RM Brain no puede procesar algo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tk-title">Título</Label>
            <Input id="tk-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Whisper Web" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tk-url">URL</Label>
            <Input id="tk-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 pt-1">
              <Input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nueva categoría"
                className="h-9"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddCategory}>
                Añadir
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tk-desc">Descripción</Label>
            <Textarea
              id="tk-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Para qué sirve y cuándo usarla?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Icono (opcional)</Label>
            <p className="text-[11px] text-muted-foreground">Si no eliges, se usará el favicon del sitio.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIconKey('')}
                className={`h-11 w-11 rounded-full grid place-items-center text-[10px] font-medium border bg-muted transition-colors ${
                  iconKey === '' ? 'border-primary ring-2 ring-primary/40' : 'border-border'
                }`}
                aria-label="Sin icono"
              >
                Auto
              </button>
              {TOOL_ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setIconKey(opt.key)}
                  className={`rounded-full transition-all ${
                    iconKey === opt.key ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                  }`}
                  aria-label={opt.label}
                  title={opt.label}
                >
                  <ToolIcon iconKey={opt.key} size={44} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-gradient-primary text-primary-foreground">
            {editing ? 'Guardar cambios' : 'Crear herramienta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
