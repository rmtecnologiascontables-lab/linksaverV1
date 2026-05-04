import type { Resource, UserProfile, Feedback } from '@/types';
import type { ContextCard } from '@/components/ContextCards';

export interface GenerateInput {
  resources: Resource[];
  profile: UserProfile;
  feedback: Feedback[];
  customInstructions: string;
  contentType: string;
  contextCards?: ContextCard[];
}

/** Builds the prompt string from input (used for real API calls) */
export function buildPrompt(input: GenerateInput): string {
  const { resources, profile, feedback, customInstructions, contentType, contextCards = [] } = input;

  const liked = feedback.filter((f) => f.rating === 'up').slice(0, 3);
  const disliked = feedback.filter((f) => f.rating === 'down').slice(0, 3);

  const profileInstructions: string[] = [];
  if (profile.name) profileInstructions.push(`Nombre del autor: ${profile.name}`);
  if (profile.company) profileInstructions.push(`Empresa/Marca: ${profile.company}`);
  if (profile.industry) profileInstructions.push(`Industria: ${profile.industry}`);
  if (profile.audience) profileInstructions.push(`Audiencia objetivo: ${profile.audience}`);
  if (profile.tone) profileInstructions.push(`Tono: ${profile.tone}`);
  if (profile.language) profileInstructions.push(`Idioma: ${profile.language}`);
  if (profile.preferredLength) profileInstructions.push(`Longitud preferida: ${profile.preferredLength}`);
  if (profile.keywords?.length) profileInstructions.push(`Palabras clave: ${profile.keywords.join(', ')}`);
  if (profile.styleExamples) profileInstructions.push(`Estilo: ${profile.styleExamples}`);
  
  const styleHints: string[] = [];
  if (liked.some((f) => /corto|short|punch/i.test(f.adjustmentNote || '')))
    styleHints.push('frases cortas con punch');
  if (disliked.some((f) => /corporativo|formal|estimados/i.test(f.adjustmentNote || '')))
    styleHints.push('evita lenguaje corporativo');
  if (profile.tone) styleHints.push(`tono ${profile.tone}`);
  if (profile.preferredLength) styleHints.push(`longitud ${profile.preferredLength}`);
  if (profile.keywords?.length) styleHints.push(`incluir: ${profile.keywords.slice(0, 3).join(', ')}`);

  const cardAnalysis = contextCards
    .map((c) => {
      let analysis = `📎 ${c.title}`;
      if (c.url) analysis += `\n   🔗 ${c.url}`;
      if (c.notes) analysis += `\n   📝 ${c.notes}`;
      return analysis;
    })
    .join('\n');

  const sources = resources
    .slice(0, 3)
    .map((r) => `• ${r.title}${r.aiSummary ? ` — ${r.aiSummary}` : ''}`)
    .join('\n');

  const banned = profile.bannedTopics?.length
    ? `\n(Evitando: ${profile.bannedTopics.join(', ')})`
    : '';

  const fullContext = [
    profileInstructions.length > 0 && `📋 PERFIL DEL AUTOR:\n${profileInstructions.join('\n')}`,
    cardAnalysis && `📎 TARJETAS DE CONTEXTO:\n${cardAnalysis}`,
    resources.length > 0 && `📚 RECURSOS SELECCIONADOS:\n${sources}`,
  ].filter(Boolean).join('\n\n');

  const intros: Record<string, string> = {
    tweet: `🧠 ${customInstructions || 'Una idea que vale la pena compartir'}.\n\n${fullContext}\n\n¿Tu próximo experimento?`,
    blog: `# ${customInstructions || 'De recurso a insight: cómo destilar contenido'}\n\n${fullContext}\n\n## Mi take\nEl patrón es claro: lo importante no es acumular, es **conectar**. ${profile.audience ? `Si construyes para ${profile.audience.split(',')[0]}, esto te aplica.` : ''}\n\n## Acción concreta\nElige UNA idea e impleméntala esta semana.`,
    newsletter: `Hola 👋\n\n${customInstructions || 'Hoy vengo con algo destilado de la semana.'}\n\n${fullContext}\n\n**Mi conclusión:**\nMenos consumo, más síntesis.\n\nNos leemos,\n${profile.name || ''}`,
    script: `[ESCENA 1 — Hook]\n"${customInstructions || '¿Y si tu segundo cerebro pudiera escribir por ti?'}"\n\n[ESCENA 2 — Contexto]\n${fullContext}\n\n[ESCENA 3 — Payoff]\nLa diferencia no es la herramienta. Es el sistema detrás.\n\n[CTA]\nDeja en comentarios qué guardas tú.`,
    email: `Asunto: ${customInstructions || 'Una idea para tu próximo proyecto'}\n\nHola,\n\n${fullContext}\n\nCreo que conecta directamente con lo que estás trabajando.\n\nUn abrazo,\n${profile.name || ''}`,
    code: `// ${customInstructions || 'Generated from RM Brain context'}\n// Context: ${resources.map((r) => r.title).join(' | ')}\n// Profile: ${profile.name || 'default'}\n\nexport async function destill(context: ContextCard[]) {\n  const insights = context.map(c => c.notes).filter(Boolean);\n  return insights.join('\\n\\n');\n}\n\n// Style: ${styleHints.join(', ')}`,
  };

  const body = intros[contentType] || intros.tweet;
  const meta = styleHints.length
    ? `\n\n— — —\n🎯 Aplicado: ${styleHints.join(' · ')}${banned}`
    : '';

  return body + meta;
}

/** Simulates an LLM by composing a context-aware mock answer. */
export function generateMockOutput(input: GenerateInput): string {
  const { resources, profile, feedback, customInstructions, contentType, contextCards = [] } = input;

  const liked = feedback.filter((f) => f.rating === 'up').slice(0, 3);
  const disliked = feedback.filter((f) => f.rating === 'down').slice(0, 3);

  // Build instructions from profile settings
  const profileInstructions: string[] = [];
  if (profile.name) profileInstructions.push(`Nombre del autor: ${profile.name}`);
  if (profile.company) profileInstructions.push(`Empresa/Marca: ${profile.company}`);
  if (profile.industry) profileInstructions.push(`Industria: ${profile.industry}`);
  if (profile.audience) profileInstructions.push(`Audiencia objetivo: ${profile.audience}`);
  if (profile.tone) profileInstructions.push(`Tono: ${profile.tone}`);
  if (profile.language) profileInstructions.push(`Idioma: ${profile.language}`);
  if (profile.preferredLength) profileInstructions.push(`Longitud preferida: ${profile.preferredLength}`);
  if (profile.keywords?.length) profileInstructions.push(`Palabras clave: ${profile.keywords.join(', ')}`);
  if (profile.styleExamples) profileInstructions.push(`Estilo示例: ${profile.styleExamples}`);
  
  // Build style hints from feedback + profile
  const styleHints: string[] = [];
  if (liked.some((f) => /corto|short|punch/i.test(f.adjustmentNote || '')))
    styleHints.push('frases cortas con punch');
  if (disliked.some((f) => /corporativo|formal|estimados/i.test(f.adjustmentNote || '')))
    styleHints.push('evita lenguaje corporativo');
  if (profile.tone) styleHints.push(`tono ${profile.tone}`);
  if (profile.preferredLength) styleHints.push(`longitud ${profile.preferredLength}`);
  if (profile.keywords?.length) styleHints.push(`incluir: ${profile.keywords.slice(0, 3).join(', ')}`);

  // Process context cards for AI analysis
  const cardAnalysis = contextCards
    .map((c) => {
      let analysis = `📎 ${c.title}`;
      if (c.url) analysis += `\n   🔗 ${c.url}`;
      if (c.notes) analysis += `\n   📝 ${c.notes}`;
      return analysis;
    })
    .join('\n');

  // Process resources
  const sources = resources
    .slice(0, 3)
    .map((r) => `• ${r.title}${r.aiSummary ? ` — ${r.aiSummary}` : ''}`)
    .join('\n');

  const banned = profile.bannedTopics?.length
    ? `\n(Evitando: ${profile.bannedTopics.join(', ')})`
    : '';

  // Combine context for the prompt
  const fullContext = [
    profileInstructions.length > 0 && `📋 PERFIL DEL AUTOR:\n${profileInstructions.join('\n')}`,
    cardAnalysis && `📎 TARJETAS DE CONTEXTO:\n${cardAnalysis}`,
    resources.length > 0 && `📚 RECURSOS SELECCIONADOS:\n${sources}`,
  ].filter(Boolean).join('\n\n');

  const intros: Record<string, string> = {
    tweet: `🧠 ${customInstructions || 'Una idea que vale la pena compartir'}.\n\n${fullContext}\n\n¿Tu próximo experimento?`,
    blog: `# ${customInstructions || 'De recurso a insight: cómo destilar contenido'}\n\n${fullContext}\n\n## Mi take\nEl patrón es claro: lo importante no es acumular, es **conectar**. ${profile.audience ? `Si construyes para ${profile.audience.split(',')[0]}, esto te aplica.` : ''}\n\n## Acción concreta\nElige UNA idea e impleméntala esta semana.`,
    newsletter: `Hola 👋\n\n${customInstructions || 'Hoy vengo con algo destilado de la semana.'}\n\n${fullContext}\n\n**Mi conclusión:**\nMenos consumo, más síntesis.\n\nNos leemos,\n${profile.name || ''}`,
    script: `[ESCENA 1 — Hook]\n"${customInstructions || '¿Y si tu segundo cerebro pudiera escribir por ti?'}"\n\n[ESCENA 2 — Contexto]\n${fullContext}\n\n[ESCENA 3 — Payoff]\nLa diferencia no es la herramienta. Es el sistema detrás.\n\n[CTA]\nDeja en comentarios qué guardas tú.`,
    email: `Asunto: ${customInstructions || 'Una idea para tu próximo proyecto'}\n\nHola,\n\n${fullContext}\n\nCreo que conecta directamente con lo que estás trabajando.\n\nUn abrazo,\n${profile.name || ''}`,
    code: `// ${customInstructions || 'Generated from RM Brain context'}\n// Context: ${resources.map((r) => r.title).join(' | ')}\n// Profile: ${profile.name || 'default'}\n\nexport async function destill(context: ContextCard[]) {\n  const insights = context.map(c => c.notes).filter(Boolean);\n  return insights.join('\\n\\n');\n}\n\n// Style: ${styleHints.join(', ')}`,
  };

  const body = intros[contentType] || intros.tweet;
  const meta = styleHints.length
    ? `\n\n— — —\n🎯 Aplicado: ${styleHints.join(' · ')}${banned}`
    : '';

  return body + meta;
}
