import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tool, ToolIconKey } from '@/types/tool';

const uid = () => Math.random().toString(36).slice(2, 10);

type SeedTool = { title: string; url: string; desc: string; iconKey?: ToolIconKey };

const DEFAULT_TOOLKIT: { category: string; tools: SeedTool[] }[] = [
  {
    category: 'Redes Sociales',
    tools: [
      { title: 'YouTube',   url: 'https://youtube.com',     desc: 'Plataforma de video más grande del mundo.', iconKey: 'youtube' },
      { title: 'Facebook',  url: 'https://facebook.com',    desc: 'Red social principal de Meta.', iconKey: 'facebook' },
      { title: 'TikTok',    url: 'https://tiktok.com',      desc: 'Videos cortos virales y tendencias.', iconKey: 'tiktok' },
      { title: 'Instagram', url: 'https://instagram.com',   desc: 'Fotos, reels y stories.', iconKey: 'instagram' },
      { title: 'X',         url: 'https://x.com',           desc: 'Conversación pública en tiempo real.', iconKey: 'x' },
      { title: 'WhatsApp',  url: 'https://web.whatsapp.com',desc: 'Mensajería instantánea web.', iconKey: 'whatsapp' },
      { title: 'LinkedIn',  url: 'https://linkedin.com',    desc: 'Red profesional y networking B2B.', iconKey: 'linkedin' },
    ],
  },
  {
    category: 'Descarga de Redes Sociales',
    tools: [
      { title: 'SnapTik', url: 'https://snaptik.app', desc: 'Descarga videos de TikTok sin marca de agua en alta calidad.' },
      { title: 'SaveFrom.net', url: 'https://savefrom.net', desc: 'Extractor universal para YouTube, Instagram, Facebook y más.' },
      { title: 'Y2Mate', url: 'https://www.y2mate.com', desc: 'Conversión rápida de video/audio desde múltiples plataformas.' },
      { title: 'IGram', url: 'https://igram.world', desc: 'Descarga fotos, videos y reels de Instagram sin registro.' },
    ],
  },
  {
    category: 'Transcripción & Audio',
    tools: [
      { title: 'Veed.io', url: 'https://www.veed.io/tools/video-translator', desc: 'Transcripción automática con subtítulos editables y traducción.' },
      { title: 'Otter.ai', url: 'https://otter.ai', desc: 'Transcripción en tiempo real para reuniones, podcasts y notas largas.' },
      { title: 'Descript', url: 'https://www.descript.com', desc: 'Edición de audio/video mediante texto + transcripción IA precisa.' },
      { title: 'Whisper Web', url: 'https://whisperweb.app', desc: 'Transcripción local gratuita usando OpenAI Whisper directamente en el navegador.' },
    ],
  },
  {
    category: 'Conversión & Edición Rápida',
    tools: [
      { title: 'FFmpeg.wasm', url: 'https://ffmpegwasm.netlify.app', desc: 'Conversor de formatos multimedia 100% local y gratuito en navegador.' },
      { title: 'Kapwing', url: 'https://www.kapwing.com', desc: 'Recorte, redimensionado y extracción de audio sin instalar software.' },
      { title: 'CloudConvert', url: 'https://cloudconvert.com', desc: 'Conversión masiva de video, audio, documentos e imágenes.' },
      { title: 'OnlineConvertFree', url: 'https://onlineconvertfree.com', desc: 'Conversor rápido sin límites estrictos ni marcas de agua.' },
    ],
  },
  {
    category: 'Análisis de Links & Extracción',
    tools: [
      { title: 'Archive.today', url: 'https://archive.ph', desc: 'Guarda copias estáticas de páginas que bloquean scrapers o IA.' },
      { title: 'SingleFile', url: 'https://github.com/gildas-lormeau/SingleFile', desc: 'Extensión/web que guarda cualquier página como un único archivo HTML.' },
      { title: 'DiffChecker', url: 'https://www.diffchecker.com', desc: 'Compara versiones de texto/links para detectar cambios o actualizaciones.' },
    ],
  },
  {
    category: 'Optimización & Compresión',
    tools: [
      { title: 'TinyPNG / TinyJPG', url: 'https://tinypng.com', desc: 'Compresión inteligente de imágenes sin pérdida visible de calidad.' },
      { title: 'HandBrake', url: 'https://handbrake.fr', desc: 'Software gratuito para comprimir y convertir videos pesados antes de subirlos.' },
      { title: 'Squoosh', url: 'https://squoosh.app', desc: 'Optimizador de imágenes local de Google con control avanzado de formatos.' },
    ],
  },
  {
    category: 'IA Especializada & Fallbacks',
    tools: [
      { title: 'Perplexity AI', url: 'https://www.perplexity.ai', desc: 'Búsqueda conversacional con fuentes citadas cuando tu IA principal falla.' },
      { title: 'HuggingChat', url: 'https://huggingface.co/chat', desc: 'Alternativa open-source a modelos cerrados para tareas técnicas o código.' },
      { title: 'Clipdrop', url: 'https://clipdrop.co', desc: 'Herramientas de IA para limpieza de fondos, upscaling y edición visual rápida.' },
    ],
  },
];

const seedCategories: string[] = DEFAULT_TOOLKIT.map((c) => c.category);

const seedTools: Tool[] = DEFAULT_TOOLKIT.flatMap((group, gi) =>
  group.tools.map((t, ti) => ({
    id: uid(),
    title: t.title,
    url: t.url,
    category: group.category,
    description: t.desc,
    isCustom: false,
    iconKey: t.iconKey,
    createdAt: new Date(Date.now() - 86400000 * (DEFAULT_TOOLKIT.length * 4 - gi * 4 - ti)).toISOString(),
  })),
);

interface ToolkitState {
  tools: Tool[];
  categories: string[];
  addTool: (t: Omit<Tool, 'id' | 'createdAt' | 'isCustom'>) => string;
  updateTool: (id: string, patch: Partial<Tool>) => void;
  deleteTool: (id: string) => void;
  addCategory: (name: string) => void;
}

export const useToolkitStore = create<ToolkitState>()(
  persist(
    (set) => ({
      tools: seedTools,
      categories: seedCategories,
      addTool: (t) => {
        const id = uid();
        const tool: Tool = {
          ...t,
          id,
          isCustom: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          tools: [tool, ...s.tools],
          categories: s.categories.includes(t.category)
            ? s.categories
            : [...s.categories, t.category],
        }));
        return id;
      },
      updateTool: (id, patch) =>
        set((s) => ({
          tools: s.tools.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          categories:
            patch.category && !s.categories.includes(patch.category)
              ? [...s.categories, patch.category]
              : s.categories,
        })),
      deleteTool: (id) =>
        set((s) => ({ tools: s.tools.filter((x) => x.id !== id) })),
      addCategory: (name) =>
        set((s) => ({
          categories: s.categories.includes(name)
            ? s.categories
            : [...s.categories, name],
        })),
    }),
    {
      name: 'rm-brain-toolkit',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted as Partial<ToolkitState>) ?? {};
        if (version < 3) {
          // Reseed to include the new Redes Sociales category with branded icons
          state.tools = seedTools;
          state.categories = seedCategories;
        }
        return state as ToolkitState;
      },
    },
  ),
);
