import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resource, UserProfile, Feedback, Theme, Project } from '@/types';
import { saveProject } from '@/lib/googleSheetsDB';

const uid = () => Math.random().toString(36).slice(2, 10);

const mockResources: Resource[] = [
  {
    id: uid(),
    type: 'link',
    url: 'https://platform.openai.com/docs/guides/prompt-engineering',
    title: 'Guía oficial de Prompt Engineering — OpenAI',
    tags: ['IA', 'Prompts', 'Frontend'],
    aiSummary: 'Mejores prácticas para diseñar prompts efectivos: dar contexto, ejemplos few-shot, especificar formato de salida y dividir tareas complejas.',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    status: 'ready',
  },
  {
    id: uid(),
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Cómo construir un Second Brain con IA',
    tags: ['Productividad', 'IA', 'Knowledge'],
    aiSummary: 'Sistema PARA aplicado a un knowledge base con embeddings. Captura, organiza, destila, expresa.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: 'ready',
  },
  {
    id: uid(),
    type: 'audio',
    title: 'Lex Fridman x Karpathy — LLMs en producción',
    tags: ['IA', 'Audio', 'Engineering'],
    aiSummary: 'Conversación sobre el ciclo de vida de modelos LLM, evaluación, fine-tuning y arquitecturas emergentes.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'ready',
  },
  {
    id: uid(),
    type: 'note',
    title: 'Idea: Newsletter semanal sobre DX',
    note: 'Formato Hook → Insight → Tool → CTA. 3 secciones max. Tono cercano pero técnico.',
    tags: ['Newsletter', 'Frontend', 'Ideas'],
    aiSummary: 'Estructura modular para newsletter con foco en developer experience.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'ready',
  },
  {
    id: uid(),
    type: 'link',
    url: 'https://www.smashingmagazine.com/2024/glassmorphism',
    title: 'Glassmorphism en 2025: cuándo usarlo (y cuándo no)',
    tags: ['UI', 'Design', 'Frontend'],
    aiSummary: 'Glassmorphism funciona mejor sobre fondos coloridos con blur fuerte y bordes sutiles. Cuidar contraste WCAG.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'ready',
  },
  {
    id: uid(),
    type: 'video',
    url: 'https://vimeo.com/example',
    title: 'Storytelling para creadores técnicos',
    tags: ['Marketing', 'Storytelling'],
    aiSummary: 'Frameworks AIDA y PAS aplicados a contenido técnico. Hook en 7 palabras o menos.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'ready',
  },
];

const mockProfile: UserProfile = {
  name: 'Ricardo M.',
  company: 'RM Studio',
  industry: 'Software / Creator Economy',
  website: 'https://rm.studio',
  tone: 'casual',
  language: 'Español',
  audience: 'Developers y creadores digitales 25-40, indie makers y founders early-stage',
  audiencePains: 'Falta de tiempo para crear contenido. Sobrecarga de información. Quieren herramientas que aprendan de su estilo.',
  preferredFormats: ['Newsletter', 'Tweet', 'Blog'],
  preferredLength: 'medio',
  keywords: ['IA', 'Productividad', 'Developer Experience', 'Indie hacking'],
  bannedTopics: ['crypto pump', 'política partidista'],
  styleExamples: 'Frases cortas. Una idea por línea. Emoji ocasional. Cero corporativismo.',
};

const mockFeedback: Feedback[] = [
  {
    id: uid(),
    promptUsed: 'Genera un tweet sobre prompt engineering',
    output: 'Un buen prompt no se escribe. Se itera. 🧠',
    contentType: 'tweet',
    rating: 'up',
    adjustmentNote: 'Me gusta que sea corto y con punch',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: uid(),
    promptUsed: 'Escribe intro de newsletter',
    output: 'Estimados suscriptores, en esta edición exploraremos...',
    contentType: 'newsletter',
    rating: 'down',
    adjustmentNote: 'Demasiado corporativo, evitar "estimados"',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

interface State {
  resources: Resource[];
  projects: Project[];
  profile: UserProfile;
  feedback: Feedback[];
  theme: Theme;

  addResource: (r: Omit<Resource, 'id' | 'createdAt' | 'status'>) => string;
  markReady: (id: string, summary: string, keyPoints?: string[]) => void;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  toggleProcessed: (id: string) => void;

  addProject: (name: string, description?: string, resourceIds?: string[]) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addResourceToProject: (projectId: string, resourceId: string) => void;
  removeResourceFromProject: (projectId: string, resourceId: string) => void;

  updateProfile: (patch: Partial<UserProfile>) => void;

  addFeedback: (f: Omit<Feedback, 'id' | 'timestamp'>) => void;
  resetLearnings: () => void;

  setTheme: (t: Theme) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      resources: mockResources,
      projects: [],
      profile: mockProfile,
      feedback: mockFeedback,
      theme: 'light',

      addResource: (r) => {
        const id = uid();
        const resource: Resource = {
          ...r,
          id,
          createdAt: new Date().toISOString(),
          status: 'processing',
        };
        set((s) => ({ resources: [resource, ...s.resources] }));
        return id;
      },
      markReady: (id, summary, keyPoints) =>
        set((s) => ({
          resources: s.resources.map((r) =>
            r.id === id ? { ...r, status: 'ready', aiSummary: summary, keyPoints: keyPoints || [] } : r,
          ),
        })),
      updateResource: (id, patch) =>
        set((s) => ({
          resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteResource: (id) =>
        set((s) => ({ resources: s.resources.filter((r) => r.id !== id) })),
      toggleProcessed: (id) =>
        set((s) => ({
          resources: s.resources.map((r) =>
            r.id === id ? { ...r, processed: !r.processed } : r
          ),
        })),

      addProject: (name, description, resourceIds = []) => {
        const id = uid();
        const now = new Date().toISOString();
        const project: Project = { id, name, description, resourceIds, createdAt: now, updatedAt: now };
        set((s) => ({ projects: [project, ...s.projects] }));

        // Get email from auth store - this will be set when user is authenticated
        const userEmail = localStorage.getItem('rm-brain-user-email');
        if (userEmail) {
          saveProject({
            id,
            name,
            description,
            resourceIds: resourceIds.join(','),
            createdAt: now,
            updatedAt: now,
            userEmail: userEmail,
          });
        }

        return id;
      },
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
        })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      addResourceToProject: (projectId, resourceId) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId && !p.resourceIds.includes(resourceId)
              ? { ...p, resourceIds: [...p.resourceIds, resourceId], updatedAt: new Date().toISOString() }
              : p,
          ),
        }));

        const project = get().projects.find(p => p.id === projectId);
        const userEmail = localStorage.getItem('rm-brain-user-email');
        if (project && userEmail) {
          updateProjectResourceIds(projectId, project.resourceIds.join(','), userEmail);
        }
      },
      removeResourceFromProject: (projectId, resourceId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, resourceIds: p.resourceIds.filter((id) => id !== resourceId), updatedAt: new Date().toISOString() }
              : p,
          ),
        })),

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      addFeedback: (f) =>
        set((s) => ({
          feedback: [
            { ...f, id: uid(), timestamp: new Date().toISOString() },
            ...s.feedback,
          ],
        })),
      resetLearnings: () => set({ feedback: [] }),

      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: 'rm-brain-store',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted as Partial<State>) ?? {};
        if (version < 3) state.theme = 'light';
        return state as State;
      },
    },
  ),
);
