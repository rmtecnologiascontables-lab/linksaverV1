import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wand2, Copy, RefreshCw, ThumbsUp, ThumbsDown, Loader2, Sparkles, Info, Bot, ChevronDown, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generateMockOutput } from '@/lib/promptEngine';
import { callOpenRouter, isOpenRouterConfigured, OPENROUTER_MODELS, CONTENT_TYPE_MODELS, generateWithContext } from '@/lib/openRouter';
import { ResourceCard } from '@/components/ResourceCard';
import { ContextCards } from '@/components/ContextCards';
import { usePromptContextStore } from '@/store/promptContextSlice';
import { toast } from 'sonner';

const contentTypes = [
  { value: 'tweet',      label: 'Tweet/X', icon: '🐦' },
  { value: 'blog',       label: 'Artículo', icon: '📝' },
  { value: 'newsletter', label: 'Newsletter', icon: '📧' },
  { value: 'script',     label: 'Guion video', icon: '🎬' },
  { value: 'email',      label: 'Email', icon: '✉️' },
  { value: 'code',       label: 'Código', icon: '💻' },
];

interface Props { preselectedId?: string | null; onConsumePreselect?: () => void; }

export function PromptStudio({ preselectedId, onConsumePreselect }: Props) {
  const allResources = useStore((s) => s.resources);
  const resources = useMemo(() => allResources.filter((r) => r.status === 'ready'), [allResources]);
  const profile = useStore((s) => s.profile);
  const feedback = useStore((s) => s.feedback);
  const addFeedback = useStore((s) => s.addFeedback);
  const { contextCards, setContextCards } = usePromptContextStore();

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
                <span className="text-xs text-muted-foreground">Recursos ({selected.size})</span>
              </div>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {resources.map((r) => (
                  <ResourceCard
                    key={r.id} resource={r}
                    selected={selected.has(r.id)}
                    onToggleSelect={() => toggle(r.id)}
                    onClick={() => toggle(r.id)}
                  />
                ))}
                {resources.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay recursos listos aún.</p>
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
