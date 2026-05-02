import { useState } from 'react';
import { Plus, X, Edit2, ExternalLink, Instagram, Youtube, Facebook, Music2, Trash2, Save, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const DEFAULT_LINKS: QuickLink[] = [
  { id: '1', name: 'YouTube', url: 'https://youtube.com', icon: 'youtube' },
  { id: '2', name: 'Facebook', url: 'https://facebook.com', icon: 'facebook' },
  { id: '3', name: 'TikTok', url: 'https://tiktok.com', icon: 'tiktok' },
  { id: '4', name: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
];

const ICON_OPTIONS = [
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'tiktok', label: 'TikTok', icon: Music2 },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'globe', label: 'Otro', icon: Globe },
];

function getIconComponent(iconName: string) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    youtube: Youtube,
    facebook: Facebook,
    tiktok: Music2,
    instagram: Instagram,
    globe: Globe,
  };
  return iconMap[iconName] || Globe;
}

interface Props {
  links: QuickLink[];
  onChange: (links: QuickLink[]) => void;
}

export function QuickLinks({ links, onChange }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDelete = (id: string) => {
    onChange(links.filter((l) => l.id !== id));
  };

  const handleSaveEdit = () => {
    if (!editingLink) return;
    onChange(links.map((l) => (l.id === editingLink.id ? editingLink : l)));
    setEditingLink(null);
    setIsEditOpen(false);
  };

  const handleAddNew = () => {
    if (!editingLink) return;
    onChange([...links, { ...editingLink, id: Date.now().toString() }]);
    setEditingLink(null);
    setIsAdding(false);
  };

  const openAddDialog = () => {
    setEditingLink({ id: '', name: '', url: '', icon: 'globe' });
    setIsAdding(true);
    setIsEditOpen(true);
  };

  const openEditDialog = (link: QuickLink) => {
    setEditingLink({ ...link });
    setIsAdding(false);
    setIsEditOpen(true);
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {links.map((link) => {
            const IconComponent = getIconComponent(link.icon);
            return (
              <div
                key={link.id}
                onClick={() => handleOpenLink(link.url)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass hover:shadow-glow transition-all shrink-0 group cursor-pointer"
                title={link.name}
              >
                <IconComponent className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{link.name}</span>
                <div className="hidden group-hover:flex items-center gap-1 ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(link);
                    }}
                    className="p-0.5 rounded hover:bg-muted"
                    title="Editar"
                  >
                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(link.id);
                    }}
                    className="p-0.5 rounded hover:bg-muted"
                    title="Eliminar"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
          <button
            onClick={openAddDialog}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition shrink-0"
            title="Agregar acceso rápido"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Agregar</span>
          </button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>{isAdding ? 'Agregar Acceso Rápido' : 'Editar Acceso Rápido'}</DialogTitle>
          <DialogDescription>
            Configura el nombre, URL e icono del acceso rápido
          </DialogDescription>

          {editingLink && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-muted-foreground">Nombre</label>
                <Input
                  value={editingLink.name}
                  onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                  placeholder="Nombre del sitio"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">URL</label>
                <Input
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  placeholder="https://ejemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Icono</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditingLink({ ...editingLink, icon: opt.value })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md border transition ${
                          editingLink.icon === opt.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={isAdding ? handleAddNew : handleSaveEdit} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {isAdding ? 'Agregar' : 'Guardar'}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
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

export { DEFAULT_LINKS };