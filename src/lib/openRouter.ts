import { generateMockOutput, buildPrompt } from './promptEngine';
import type { Resource, UserProfile, Feedback } from '@/types';
import type { ContextCard } from '@/components/ContextCards';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENROUTER_REFERER = import.meta.env.VITE_OPENROUTER_REFERER || 'https://linksaver-v1.vercel.app';
const OPENROUTER_TITLE = import.meta.env.VITE_OPENROUTER_TITLE || 'RM Brain';
const OPENROUTER_DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openai/gpt-5.2';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key no configurada. Usando modo mock.');
    return generateMockOutput(messages[messages.length - 1]?.content || '');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': OPENROUTER_REFERER,
        'X-OpenRouter-Title': OPENROUTER_TITLE,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || OPENROUTER_DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter error:', error);
      throw new Error(error.error?.message || 'Error en OpenRouter');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    // Fallback to mock - return a simple message instead of calling generateMockOutput with wrong type
    const lastMessage = messages[messages.length - 1]?.content || '';
    return `📰 Extracción de contenido no disponible.\n\nError: La API de OpenRouter no está configurada o la key expiró.\n\nContenido a procesar:\n${lastMessage.slice(0, 500)}...\n\n➡️ Ve a openrouter.ai para obtener una nueva API key.`;
  }
}

export async function callGroq(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key no configurada');
    return '';
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || GROQ_DEFAULT_MODEL,
          messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.max_tokens ?? 4096,
        }),
      });

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const retryAfter = errorData.error?.message?.match(/try again in ([\d.]+)s/);
        const waitTime = retryAfter ? parseFloat(retryAfter[1]) * 1000 : 2000;
        
        console.warn(`Rate limited. Retry ${attempt + 1}/${maxRetries} in ${waitTime}ms`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }

      if (!response.ok) {
        const error = await response.json();
        console.error('Groq error:', error);
        throw new Error(error.error?.message || 'Error en Groq');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      lastError = error as Error;
      console.error('Error calling Groq:', error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Groq failed after retries');
}

// Modelos disponibles en OpenRouter
export const OPENROUTER_MODELS = [
  // OpenAI
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', description: 'Más reciente y potente' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Multimodal avanzado' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Rápido y económico' },
  { id: 'openai/o1', name: 'o1', provider: 'OpenAI', description: 'Reasoning avanzado' },
  { id: 'openai/o1-mini', name: 'o1 Mini', provider: 'OpenAI', description: 'Reasoning rápido' },
  // Anthropic
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Mejor escritura y análisis' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Rápido y eficiente' },
  // Google
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Ultra rápido y reciente' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', description: 'Gran contexto' },
  // Meta
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Open source potente' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta', description: 'Muy grande' },
  // Mistral
  { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', provider: 'Mistral', description: 'Mixture of Experts' },
  { id: 'mistralai/mistral-small', name: 'Mistral Small', provider: 'Mistral', description: 'Eficiente' },
  // DeepSeek
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', description: 'Código y matemática' },
  { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek', description: 'Especializado en código' },
  // Others
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'Qwen', description: 'Excelente性价比' },
  { id: 'cognitive-computations/dolphin-mixtral-8x22b', name: 'Dolphin Mixtral', provider: 'Cognitive', description: 'Sin restricciones' },
];

export function isOpenRouterConfigured(): boolean {
  return !!OPENROUTER_API_KEY;
}

// Interfaz para generar contenido con contexto
export interface GenerateWithContextOptions {
  resources: Resource[];
  profile: UserProfile;
  feedback: Feedback[];
  customInstructions: string;
  contentType: string;
  contextCards?: ContextCard[];
  model?: string;
}

// Mapeo de tipos de contenido a modelos recomendados
export const CONTENT_TYPE_MODELS: Record<string, string> = {
  tweet: 'anthropic/claude-3.5-sonnet',       // Bueno para texto corto y creativo
  blog: 'deepseek/deepseek-chat',             // Bueno para artículos largos
  newsletter: 'anthropic/claude-3.5-sonnet',   // Mejor escritura y estructura
  script: 'google/gemini-2.0-flash-exp',        // Rápido para guiones
  email: 'openai/gpt-4o',                      // Profesional y versátil
  code: 'deepseek/deepseek-coder',             // Especializado en código
};

// Generar contenido con OpenRouter usando el contexto del usuario
export async function generateWithContext(options: GenerateWithContextOptions): Promise<string> {
  const { 
    resources, 
    profile, 
    feedback, 
    customInstructions, 
    contentType, 
    contextCards = [],
    model 
  } = options;

  // Usar modelo específico o el recomendado para el tipo de contenido
  const selectedModel = model || CONTENT_TYPE_MODELS[contentType] || OPENROUTER_DEFAULT_MODEL;

  // Construir el prompt completo usando el promptEngine
  const prompt = buildPrompt({
    resources,
    profile,
    feedback,
    customInstructions,
    contentType,
    contextCards,
  });

  // Crear mensajes para la API
  const systemPrompt = `Eres un asistente de IA especializado en crear contenido de alta calidad basado en recursos y contexto personalizado. 
Tu objetivo es generar contenido que:
- Sea relevante para los recursos proporcionados
- Se ajuste al tono y estilo del usuario (${profile.tone || 'casual'})
- Use el idioma preferido (${profile.language || 'Español'})
- Sea de longitud ${profile.preferredLength || 'media'}
- Evite temas como: ${profile.bannedTopics?.join(', ') || 'ninguno'}

Responde siempre en español mexicano de forma natural y profesional.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: prompt },
  ];

  return callOpenRouter(messages, { model: selectedModel, temperature: 0.7 });
}