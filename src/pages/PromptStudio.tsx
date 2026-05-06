import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wand2, Copy, RefreshCw, ThumbsUp, ThumbsDown, Loader2, Sparkles, Info, Bot, ChevronDown, Zap, Plus, Trash2, Library, Check, X, Folder } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generateMockOutput } from '@/lib/promptEngine';
import { callOpenRouter, isOpenRouterConfigured, OPENROUTER_MODELS, CONTENT_TYPE_MODELS, generateWithContext } from '@/lib/openRouter';
import { ResourceCard } from '@/components/ResourceCard';
import { ContextCards } from '@/components/ContextCards';
import { usePromptContextStore } from '@/store/promptContextSlice';
import { toast } from 'sonner';
import type { Resource } from '@/types';

const contentTypes = [
  { value: 'tweet',       label: 'Tweet/X', icon: '🐦' },
  { value: 'blog',        label: 'Artículo', icon: '📝' },
  { value: 'newsletter',  label: 'Newsletter', icon: '📧' },
  { value: 'script',      label: 'Video Script', icon: '🎬' },
  { value: 'imagePrompt', label: 'Image Prompt', icon: '🖼️' },
  { value: 'brainstorm',  label: 'Brainstorming', icon: '💡' },
  { value: 'opinion',     label: 'Opinión', icon: '🗣️' },
  { value: 'resumen',     label: 'Resumen', icon: '📊' },
  { value: 'email',       label: 'Email', icon: '✉️' },
  { value: 'code',        label: 'Código', icon: '💻' },
];

interface Props { preselectedId?: string | null; onConsumePreselect?: () => void; }

export function PromptStudio({ preselectedId, onConsumePreselect }: Props) {
  const allResources = useStore((s) => s.resources);
  const resources = useMemo(() => allResources.filter((r) => r.status === 'ready'), [allResources]);
  const profile = useStore((s) => s.profile);
  const feedback = useStore((s) => s.feedback);
  const addFeedback = useStore((s) => s.addFeedback);
  const deleteResource = useStore((s) => s.deleteResource);
  const projects = useStore((s) => s.projects);
  const addResourceToProject = useStore((s) => s.addResourceToProject);
  const { contextCards, setContextCards } = usePromptContextStore();

  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedResourceForProject, setSelectedResourceForProject] = useState<Resource | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contentType, setContentType] = useState('tweet');
  const [instructions, setInstructions] = useState('');
  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [adjustment, setAdjustment] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const handleSaveAsLearning = (resource: any) => {
    const newCard = {
      id: Date.now().toString(),
      title: resource.title,
      url: resource.url,
      notes: resource.aiSummary,
    };
    setContextCards([...contextCards, newCard]);
    toast.success('Guardado como aprendizaje');
  };

  const handleInjectFromLibrary = (resourceIds: string[]) => {
    setSelected((prev) => {
      const n = new Set(prev);
      resourceIds.forEach(id => n.add(id));
      return n;
    });
    setShowLibraryModal(false);
    toast.success(`${resourceIds.length} recursos inyectados`);
  };

  const handleImportFromProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || project.resourceIds.length === 0) {
      toast.error('Este proyecto no tiene recursos');
      return;
    }
    setSelected((prev) => {
      const n = new Set(prev);
      project.resourceIds.forEach(id => n.add(id));
      return n;
    });
    setShowProjectPicker(false);
    toast.success(`${project.resourceIds.length} recursos importados de "${project.name}"`);
  };

  const handleRemoveSelected = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  // Obtener modelo recomendado según tipo de contenido
  const recommendedModel = CONTENT_TYPE_MODELS[contentType] || 'deepseek/deepseek-chat';
  
  // Inicializar modelo si no hay uno seleccionado
  useEffect(() => {
    if (!selectedModel) {
      setSelectedModel(recommendedModel);
    }
  }, [contentType]);

  useEffect(() => {
    if (preselectedId) {
      setSelected((prev) => new Set([...prev, preselectedId]));
      onConsumePreselect?.();
    }
  }, [preselectedId, onConsumePreselect]);

  const selectedResources = useMemo(
    () => resources.filter((r) => selected.has(r.id)),
    [resources, selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const generate = async () => {
    if (selectedResources.length === 0 && contextCards.length === 0) { 
      toast.error('Selecciona al menos un recurso o agrega una tarjeta de contexto'); 
      return; 
    }
    setGenerating(true);
    setOutput('');
    
    let full = '';
    
    // Usar OpenRouter si está configurado
    if (isOpenRouterConfigured()) {
      try {
        const modelToUse = selectedModel || recommendedModel;
        console.log('🤖 Generando con:', modelToUse);
        
        full = await generateWithContext({
          resources: selectedResources,
          profile,
          feedback,
          customInstructions: instructions,
          contentType,
          contextCards,
          model: modelToUse,
        });
        
        toast.success('✨ Generado con IA real');
      } catch (error) {
        console.error('Error con OpenRouter:', error);
        // Fallback a mock
        full = generateMockOutput({
          resources: selectedResources, 
          profile, 
          feedback, 
          customInstructions: instructions, 
          contentType,
          contextCards,
        });
        toast.warning('Usando modo fallback (mock)');
      }
    } else {
      // Modo mock
      await new Promise((r) => setTimeout(r, 900));
      full = generateMockOutput({
        resources: selectedResources, 
        profile, 
        feedback, 
        customInstructions: instructions, 
        contentType,
        contextCards,
      });
    }
    
    // Typing animation
    let i = 0;
    const interval = setInterval(() => {
      i += Math.max(2, Math.floor(full.length / 80));
      setOutput(full.slice(0, i));
      if (i >= full.length) { clearInterval(interval); setGenerating(false); }
    }, 18);
  };

  const sendFeedback = (rating: 'up' | 'down') => {
    addFeedback({
      resourceIds: Array.from(selected),
      promptUsed: instructions || `(${contentType})`,
      output, contentType, rating,
      adjustmentNote: adjustment || undefined,
    });
    setAdjustment(''); setShowAdjust(false);
    toast.success('✅ Preferencia guardada. Próximos prompts se ajustarán a tu estilo.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Resource selector & Context Cards */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="glass-strong rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Contexto</h2>
            <button
              onClick={() => setShowContextEditor(!showContextEditor)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Info className="w-3 h-3" /> {showContextEditor ? 'Ocultar' : 'Editar'}
            </button>
          </div>
          
          {showContextEditor && (
            <ContextCards cards={contextCards} onChange={setContextCards} maxCards={5} />
          )}

          {!showContextEditor && (
            <>
              <div className="flex items-center justify-between mb-2 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Recursos ({selected.size})</span>
                  {selected.size > 2 && (
                    <button
                      onClick={() => {
                        setSelected(new Set());
                        toast.success('Selección limpiada');
                      }}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Limpiar todo
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {projects.length > 0 && (
                    <button
                      onClick={() => setShowProjectPicker(true)}
                      className="text-xs text-accent hover:underline flex items-center gap-1"
                    >
                      <Folder className="w-3 h-3" /> Importar carpeta
                    </button>
                  )}
                  <button
                    onClick={() => setShowLibraryModal(true)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Añadir más
                  </button>
                </div>
              </div>
              
              {selected.size > 0 ? (
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-muted-foreground mb-2">Recursos seleccionados:</div>
                  {selectedResources.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 border border-border/50 group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs">📄</span>
                        <span className="text-sm truncate">{r.title}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveSelected(r.id)}
                        className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition"
                        title="Quitar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl mb-4">
                  No hay recursos seleccionados. Agrega contenido desde tu Biblioteca para empezar a generar.
                </div>
              )}

              <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                {resources.map((r) => (
                  <ResourceCard
                    key={r.id} resource={r}
                    selected={selected.has(r.id)}
                    onToggleSelect={() => toggle(r.id)}
                    onClick={() => toggle(r.id)}
                    onSaveAsLearning={handleSaveAsLearning}
                    onDelete={(res) => {
                      deleteResource(res.id);
                      toast.success('Recurso eliminado');
                    }}
                    onAddToProject={(res) => {
                      setSelectedResourceForProject(res);
                      setShowProjectSelector(true);
                    }}
                  />
                ))}
                {resources.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Library className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay recursos en tu biblioteca.</p>
                    <p className="text-xs mt-1">Guarda enlaces para usarlos aquí.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Center: Instructions */}
      <section className="lg:col-span-8 space-y-5">
        <div className="glass-strong rounded-3xl p-6 space-y-5">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tipo de contenido</div>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((c) => (
                  <button
                    key={c.value} onClick={() => setContentType(c.value)}
                    className={`px-3.5 py-2 rounded-xl text-sm transition-all ring-focus ${contentType === c.value ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}
                  >{c.icon} {c.label}</button>
                ))}
              </div>
            </div>

            {/* Selector de modelo */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm hover:text-foreground ring-focus"
              >
                <Bot className="w-4 h-4 text-accent" />
                <span className="hidden sm:inline">
                  {OPENROUTER_MODELS.find(m => m.id === selectedModel)?.name || selectedModel?.split('/')[1] || 'Modelo'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showModelSelector && (
                <div className="absolute right-0 top-full mt-2 w-72 glass-strong rounded-xl p-2 z-50 shadow-xl max-h-80 overflow-y-auto">
                  <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Recomendado para {contentTypes.find(c => c.value === contentType)?.label}
                  </div>
                  {OPENROUTER_MODELS.filter(m => m.id.includes('deepseek') || m.id.includes('claude') || m.id.includes('gpt')).map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setShowModelSelector(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        selectedModel === model.id ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="text-xs text-muted-foreground w-16">{model.provider}</span>
                      <span className="flex-1">{model.name}</span>
                      {model.id === recommendedModel && contentType === contentType && (
                        <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">★</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Instrucciones personalizadas</div>
            <textarea
              value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4}
              placeholder="Ej: Escribe un tweet provocador conectando estos recursos con la idea de 'menos consumo, más síntesis'..."
              className="w-full bg-input/60 border border-border rounded-2xl p-4 text-sm ring-focus resize-none"
            />
          </div>

          <button
            onClick={generate} disabled={generating}
            className="w-full h-12 rounded-2xl bg-gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 shadow-glow disabled:opacity-60 ring-focus"
          >
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</> : <><Wand2 className="w-4 h-4" /> Generar con tu contexto</>}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            {selectedResources.length} recursos · {contextCards.length} tarjetas · {feedback.filter((f) => f.rating === 'up').length} aprendizajes 👍 · tono <b className="text-foreground">{profile.tone}</b>
          </p>
        </div>

        {/* Output */}
        <AnimatePresence>
          {output && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-strong rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Output IA</div>
                <div className="flex gap-2">
                  <IconBtn onClick={() => { navigator.clipboard.writeText(output); toast.success('Copiado'); }} label="Copiar"><Copy className="w-4 h-4" /></IconBtn>
                  <IconBtn onClick={generate} label="Regenerar"><RefreshCw className="w-4 h-4" /></IconBtn>
                </div>
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans text-foreground/95 leading-relaxed">{output}{generating && <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />}</pre>

              <div className="border-t border-border/50 pt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground mr-1">¿Te sirvió?</span>
                <button onClick={() => sendFeedback('up')} className="h-9 px-3 rounded-xl glass hover:bg-success/15 hover:text-success flex items-center gap-1.5 text-sm ring-focus">
                  <ThumbsUp className="w-4 h-4" /> Sí
                </button>
                <button onClick={() => setShowAdjust((v) => !v)} className="h-9 px-3 rounded-xl glass hover:bg-destructive/15 hover:text-destructive flex items-center gap-1.5 text-sm ring-focus">
                  <ThumbsDown className="w-4 h-4" /> Ajustar
                </button>
              </div>

              {showAdjust && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <textarea
                    value={adjustment} onChange={(e) => setAdjustment(e.target.value)} rows={2}
                    placeholder="¿Qué ajustar? Ej: 'demasiado corporativo', 'más corto', 'sin emojis'..."
                    className="w-full bg-input/60 border border-border rounded-xl p-3 text-sm ring-focus resize-none"
                  />
                  <button onClick={() => sendFeedback('down')} className="w-full h-10 rounded-xl bg-destructive/90 text-destructive-foreground text-sm font-medium ring-focus">
                    Guardar ajuste
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <LibraryModal
        open={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        resources={resources}
        selectedIds={Array.from(selected)}
        onSelect={handleInjectFromLibrary}
        onSaveAsLearning={handleSaveAsLearning}
        onDelete={(res) => {
          deleteResource(res.id);
          toast.success('Recurso eliminado');
        }}
        onAddToProject={(res) => {
          setSelectedResourceForProject(res);
          setShowProjectSelector(true);
        }}
      />

      {showProjectPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowProjectPicker(false)} />
          <div className="relative glass-strong rounded-3xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="font-semibold flex items-center gap-2">
                <Folder className="w-4 h-4 text-accent" />
                Importar desde Proyecto
              </h2>
              <button onClick={() => setShowProjectPicker(false)} className="p-2 rounded-full glass hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {projects.filter(p => p.resourceIds.length > 0).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay proyectos con recursos. Crea un proyecto y agrega recursos desde tu Biblioteca.
                </p>
              ) : (
                projects.filter(p => p.resourceIds.length > 0).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleImportFromProject(p.id)}
                    className="w-full text-left p-4 rounded-xl glass hover:bg-primary/10 border border-transparent hover:border-primary/40 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.resourceIds.length} recursos</div>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, label }: React.PropsWithChildren<{ onClick: () => void; label: string }>) {
  return (
    <button onClick={onClick} aria-label={label}
      className="w-9 h-9 rounded-lg glass grid place-items-center hover:text-primary-glow ring-focus">
      {children}
    </button>
  );
}

function LibraryModal({
  open,
  onClose,
  resources,
  selectedIds,
  onSelect,
  onSaveAsLearning,
  onDelete,
  onAddToProject
}: {
  open: boolean;
  onClose: () => void;
  resources: any[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onSaveAsLearning?: (resource: any) => void;
  onDelete?: (id: string) => void;
  onAddToProject?: (resource: any) => void;
}) {
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set(selectedIds));

  const toggle = (id: string) => {
    setTempSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(tempSelected));
    onClose();
  };

  const handleSelectAll = () => {
    if (tempSelected.size === resources.length) {
      setTempSelected(new Set());
    } else {
      setTempSelected(new Set(resources.map(r => r.id)));
    }
  };

if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-strong rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Library className="w-4 h-4 text-primary" />
              Inyectar desde Biblioteca
            </h2>
            <button onClick={onClose} className="p-2 rounded-full glass hover:bg-muted">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-4 border-b border-border/30">
            <button
              onClick={handleSelectAll}
              className="text-xs text-primary hover:underline"
            >
              {tempSelected.size === resources.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            <span className="text-xs text-muted-foreground">
              ({tempSelected.size} de {resources.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
              {resources.map((r) => (
                <ResourceCard
                  key={r.id} resource={r}
                  selected={selectedIds.includes(r.id)}
                  onToggleSelect={() => toggle(r.id)}
                  onClick={() => toggle(r.id)}
                  onSaveAsLearning={onSaveAsLearning}
                  onDelete={() => {
                    if (confirm('¿Eliminar este recurso?')) {
                      onDelete?.(r);
                    }
                  }}
                  onAddToProject={onAddToProject}
                />
              ))}
              {resources.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Library className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay recursos en tu biblioteca.</p>
                  <p className="text-xs mt-1">Guarda enlaces para usarlos aquí.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 border-t border-border/50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl glass text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 h-11 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow"
            >
              Inyectar {tempSelected.size} recursos
            </button>
          </div>
        </div>
      </div>

      {showProjectSelector && selectedResourceForProject && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowProjectSelector(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="relative glass-strong rounded-2xl p-5 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              Agregar a proyecto
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona un proyecto para "{selectedResourceForProject.title}"
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay proyectos. Crea uno primero.
                </p>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      addResourceToProject(p.id, selectedResourceForProject.id);
                      toast.success(`Agregado a "${p.name}"`);
                      setShowProjectSelector(false);
                      setSelectedResourceForProject(null);
                    }}
                    className="w-full text-left p-3 rounded-xl glass hover:bg-primary/10 border border-transparent hover:border-primary/40 transition-all"
                  >
                    {p.name}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setShowProjectSelector(false); setSelectedResourceForProject(null); }}
              className="w-full mt-4 p-2 rounded-xl glass text-sm"
            >
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
