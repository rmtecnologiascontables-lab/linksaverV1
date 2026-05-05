import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Sparkles, Wand2, FolderPlus, Folder, Plus, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/authSlice';
import { saveResource } from '@/lib/googleSheetsDB';
import { saveProject, updateProjectResourceIds } from '@/lib/googleSheetsDB';
import { analyzeUrlWithKeyPoints, fetchHtmlWithProxy } from '@/lib/contentExtractor';
import type { ResourceType } from '@/types';
import { toast } from 'sonner';

interface Props { open: boolean; onClose: () => void; }

const types: { value: ResourceType; label: string }[] = [
  { value: 'link',  label: 'Link' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'note',  label: 'Nota' },
  { value: 'ai',   label: 'AI' },
];

export function AddResourceSheet({ open, onClose }: Props) {
  const addResource = useStore((s) => s.addResource);
  const markReady = useStore((s) => s.markReady);
  const profile = useStore((s) => s.profile);
  const projects = useStore((s) => s.projects);
  const addProject = useStore((s) => s.addProject);
  const addResourceToProject = useStore((s) => s.addResourceToProject);
  const user = useAuthStore((s) => s.user);

  const [type, setType] = useState<ResourceType>('link');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [note, setNote] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    const analyzeUrl = async () => {
      const urlMatch = url.match(/^https?:\/\/.+/);
      if (urlMatch && !analyzing) {
        setAnalyzing(true);
        try {
          const html = await fetchHtmlWithProxy(url);
          
          let extractedTitle = '';
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) extractedTitle = titleMatch[1].trim();
          else {
            const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            if (h1Match) extractedTitle = h1Match[1].trim();
          }

          const { summary, keyPoints: points } = await analyzeUrlWithKeyPoints(url);
          if (points && points.length > 0) {
            setKeyPoints(points);
          }
          
          if (extractedTitle && !title) {
            const cleanTitle = extractedTitle
              .replace(/[-|]\s*La Opinión$/i, '')
              .replace(/[-|]\s*El Diario$/i, '')
              .replace(/[-|]\s*News$/i, '')
              .trim();
            if (cleanTitle) setTitle(cleanTitle);
          }
          
          if (summary) {
            setNote(summary);
            if (points && points.length > 0) setKeyPoints(points);
            toast.success('Contenido analizado con IA - 5 puntos clave extraídos', { duration: 3000 });
          }
        } catch (err) {
          console.warn('URL analysis failed:', err);
        } finally {
          setAnalyzing(false);
        }
      }
    };

    const timeout = setTimeout(analyzeUrl, 1500);
    return () => clearTimeout(timeout);
  }, [url, title, analyzing]);

  const reset = () => { 
    setType('link'); 
    setUrl(''); 
    setTitle(''); 
    setTagsInput(''); 
    setNote(''); 
    setKeyPoints([]); 
    setProcessing(false); 
    setAnalyzing(false);
    setSelectedProjects([]);
    setNewProjectName('');
    setShowProjectSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Falta el título'); return; }
    setProcessing(true);
    
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    
    // 1. Guardar en store local (siempre funciona)
    const id = addResource({ type, url: url || undefined, title, tags, note: note || undefined });

    // 2. Guardar en Google Sheets (si el usuario está logueado)
    let aiSummary = '';
    if (user?.email) {
      try {
        const savedToSheets = await saveResource({
          type,
          url: url || undefined,
          title,
          tags,
          note: note || undefined,
          userEmail: user.email,
          createdAt: new Date().toISOString(),
          status: 'processing',
        });
        
        if (savedToSheets) {
          console.log('✅ Recurso guardado en Google Sheets');
        } else {
          console.log('⚠️ No se guardó en Sheets (pero OK localmente)');
        }
      } catch (error) {
        console.error('Error guardando en Sheets:', error);
      }
    } else {
      console.log('ℹ️ Usuario no logueado, solo se guarda localmente');
    }

    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 800));
    
    // Usar los keyPoints extraídos o generar por defecto
    const finalKeyPoints = keyPoints.length > 0 
      ? keyPoints 
      : [
          `Punto clave 1 sobre ${title}`,
          `Dato importante relacionado con el tema`,
          `Contexto relevante para ${profile.audience || 'tu audiencia'}`,
          `Impacto o consecuencia del contenido`,
          `Próximo paso o acción recomendada`
        ];
    
    aiSummary = note || `Resumen IA generado automáticamente para "${title}". Puntos clave detectados y vinculados a tu perfil.`;
    markReady(id, aiSummary, finalKeyPoints);
    
    // Asignar a proyectos seleccionados y sincronizar con Google Sheets
    if (selectedProjects.length > 0) {
      selectedProjects.forEach(async (projectId) => {
        addResourceToProject(projectId, id);
        
        // Sincronizar con Google Sheets
        if (user?.email) {
          const project = projects.find(p => p.id === projectId);
          if (project) {
            const currentIds = project.resourceIds || [];
            const newResourceIds = currentIds.length > 0 ? `${currentIds},${id}` : id;
            await updateProjectResourceIds(projectId, newResourceIds, user.email);
          }
        }
      });
    }
    
    toast.success(`Recurso añadido y procesado${selectedProjects.length > 0 ? ` a ${selectedProjects.length} proyecto(s)` : ''}`);
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] z-50 glass-strong md:border-l border-border rounded-t-3xl md:rounded-none shadow-elegant flex flex-col max-h-[92vh]"
            role="dialog" aria-modal="true" aria-label="Añadir recurso"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div>
                <h2 className="font-semibold text-lg">Convierte este enlace en conocimiento inteligente.</h2>
                <p className="text-xs text-muted-foreground mt-1">Pega el link en la ventana URL, la IA de RM Brain no solo guarda el link: analizará el contenido, extraerá puntos clave y lo organizará automáticamente en tu biblioteca para que lo encuentres cuando lo necesites.</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full glass grid place-items-center ring-focus" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-border/30 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Proyectos</span>
                  {selectedProjects.length > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {selectedProjects.length} selected
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowProjectSelector(!showProjectSelector)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {showProjectSelector ? 'Ocultar' : 'Asignar proyectos'}
                </button>
              </div>

              {showProjectSelector && (
                <div className="mt-3 space-y-2">
                  {projects.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjects((prev) =>
                              prev.includes(project.id)
                                ? prev.filter((id) => id !== project.id)
                                : [...prev, project.id]
                            );
                          }}
                          className={`text-left p-2 rounded-lg border text-sm flex items-center gap-2 transition-all ${
                            selectedProjects.includes(project.id)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedProjects.includes(project.id) ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {selectedProjects.includes(project.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No hay proyectos aún.</p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Nuevo proyecto..."
                      className="flex-1 text-sm bg-input/60 border border-border rounded-lg px-3 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newProjectName.trim()) {
                          const newId = addProject(newProjectName.trim());
                          setSelectedProjects((prev) => [...prev, newId]);
                          
                          // Guardar en Google Sheets
                          if (user?.email) {
                            await saveProject({
                              id: newId,
                              name: newProjectName.trim(),
                              description: '',
                              resourceIds: '',
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                              userEmail: user.email,
                            });
                            console.log('✅ Proyecto guardado en Google Sheets');
                          }
                          
                          setNewProjectName('');
                          toast.success(`Proyecto "${newProjectName.trim()}" creado`);
                        }
                      }}
                      disabled={!newProjectName.trim()}
                      className="px-3 py-1.5 bg-gradient-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Tipo</label>
                <div className="grid grid-cols-4 gap-2">
                  {types.map((t) => (
                    <button
                      type="button" key={t.value} onClick={() => setType(t.value)}
                      className={`py-2.5 rounded-xl text-sm transition-all ring-focus ${type === t.value ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              {type !== 'note' && (
                <Field label="URL">
                  <div className="relative">
                    <input
                      type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus pr-10"
                    />
                    {analyzing && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Wand2 className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                  {analyzing && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analizando contenido con IA...
                    </p>
                  )}
                </Field>
              )}

              <Field label="Título *">
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder="Dale un título descriptivo"
                  className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus"
                />
              </Field>

              <Field label="Tags (separadas por coma)">
                <input
                  value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="IA, Frontend, Productividad"
                  className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus"
                />
              </Field>

              <Field label={note ? "Resumen IA (generado automáticamente)" : "Notas personales"}>
                <textarea
                  value={note} onChange={(e) => setNote(e.target.value)} rows={4}
                  placeholder={note ? "" : "¿Por qué te interesa? ¿Cómo lo usarás?"}
                  className={`w-full bg-input/60 border rounded-xl px-3.5 py-2.5 text-sm ring-focus resize-none ${note ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                />
                {note && (
                  <button
                    type="button"
                    onClick={() => setNote('')}
                    className="text-xs text-muted-foreground hover:text-foreground mt-1"
                  >
                    ✕ Limpiar resumen IA
                  </button>
                )}
              </Field>
            </form>

            <div className="p-5 border-t border-border/50">
              <button
                onClick={handleSubmit as any} disabled={processing}
                className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 shadow-glow disabled:opacity-60 ring-focus"
              >
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando con IA...</> : <><Sparkles className="w-4 h-4" /> Convertir en conocimiento</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">{label}</label>
      {children}
    </div>
  );
}
