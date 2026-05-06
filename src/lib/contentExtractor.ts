export interface ContentSection {
  id: string;
  title: string;
  preview: string;
  content: string;
  lang: 'es-MX' | 'en-US';
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectLanguage(text: string): 'es-MX' | 'en-US' {
  const spanishChars = /[áéíóúñü¿¡]/i;
  const englishWords = /\b(the|and|is|are|was|were|have|has|this|that|with|from)\b/i;
  
  const spanishCount = (text.match(/[áéíóúñü¿¡]/g) || []).length;
  const englishCount = (text.match(englishWords) || []).length;
  
  return spanishCount > englishCount ? 'es-MX' : 'en-US';
}

function generatePreview(text: string, maxWords = 15): string {
  const words = text.split(/\s+/).slice(0, maxWords);
  return words.join(' ') + (text.split(/\s+/).length > maxWords ? '...' : '');
}

export async function extractContentFromUrl(html: string, url: string): Promise<ContentSection[]> {
  let cleanText = html;
  
  if (html.includes('<article>')) {
    cleanText = html.replace(/<article>/g, '').replace(/<\/article>/g, '');
  } else {
    cleanText = stripHtml(html);
  }
  
  const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
  
  const skipPatterns = [
    /^[A-Z][A-Z\s]{10,80}$/,
    /^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i,
    /^\w+,?\s+\d{1,2}\s+de\s+\w+/i,
    /^[A-Z][A-Z]{2,}\s+[A-Z][A-Z]{2,}/,
    /^#/,
    /^\d+\.\d+\.\d+/,
    /^[A-Z]:\s*$/,
  ];
  
  const isSkipLine = (text: string) => skipPatterns.some(p => p.test(text.trim()));
  
  const isNoiseLine = (text: string) => {
    const noisePatterns = [
      /https?:\/\//,
      /www\./,
      /\*\s*\[/,
      /!\[[\s\S]*?\]\(/,
      /blob:/,
      /\.(jpg|jpeg|png|gif|webp|svg)/i,
      /TV Azteca/i,
      /Azteca Noticias/i,
      /tvazteca\.com\//,
      /menu/i,
      /footer/i,
      /header/i,
      /copyright/i,
      /todos los derechos/i,
      /política de privacidad/i,
      /términos y condiciones/i,
      /^\s*$/,
    ];
    return noisePatterns.some(p => p.test(text));
  };
  
  const cleanContent = (text: string) => {
    return text
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/www\.[^\s]+/gi, '')
      .replace(/\*\s*\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/!\[[\s\S]*?\]\([^)]+\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const contentLines: string[] = [];
  let foundContent = false;
  let contentStartIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.length < 30) continue;
    if (isNoiseLine(trimmed)) continue;
    
    if (!foundContent && isSkipLine(trimmed)) {
      continue;
    }
    
    if (!foundContent) {
      contentStartIndex = i;
      foundContent = true;
    }
    
    const cleanedLine = cleanContent(trimmed);
    if (cleanedLine.length > 20) {
      contentLines.push(cleanedLine);
    }
  }
  
  const fullContent = contentLines.join('. ');
  
  if (fullContent.length < 100) {
    return [];
  }
  
  const sections: ContentSection[] = [];
  
  const chunks = fullContent.match(/.{1,4000}(?:\.|$)/g) || [fullContent];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    if (chunk.length < 50) continue;
    
    sections.push({
      id: crypto.randomUUID(),
      title: `Parte ${i + 1}`,
      preview: generatePreview(chunk),
      content: chunk,
      lang: detectLanguage(chunk),
    });
  }
  
  if (sections.length === 0 && cleanText.length > 100) {
    const firstParagraphs = paragraphs.slice(0, 3).join('. ');
    if (firstParagraphs.length > 50) {
      sections.push({
        id: crypto.randomUUID(),
        title: 'Resumen',
        preview: generatePreview(firstParagraphs),
        content: firstParagraphs,
        lang: detectLanguage(firstParagraphs),
      });
    }
  }

  return sections.filter(s => s.content.length > 50);
}

export async function fetchHtmlWithProxy(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  try {
    const response = await fetch(jinaUrl, {
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      const text = await response.text();
      if (text.length > 100) {
        return `<article>${text}</article>`;
      }
    }
  } catch (error) {
    console.warn('Jina failed:', error);
  }

  const corsproxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  try {
    const response = await fetch(corsproxyUrl, {
      signal: AbortSignal.timeout(25000)
    });
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn('Corsproxy failed:', error);
  }

  throw new Error('No se pudo obtener el contenido. Intenta con otra URL.');
}

function extractPageTitle(html: string, url: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].trim();
  }

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    return ogTitleMatch[1].trim();
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\.[^/.]+$/, '');
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }
  } catch {}

  return '';
}

export interface UrlAnalysisResult {
  summary: string;
  title: string;
  type: 'article' | 'portal' | 'unknown';
}

export async function analyzeUrlPortal(url: string): Promise<{ summary: string; keyPoints: string[] }> {
  try {
    const html = await fetchHtmlWithProxy(url);
    const sections = await extractContentFromUrl(html, url);

    if (sections.length === 0) {
      return { summary: 'Portal web general', keyPoints: [] };
    }

    const contentText = sections.map(s => s.content).join(' ').slice(0, 4000);

    const prompt = `Analiza la siguiente página web y genera UNA descripción básica del tipo de portal o sitio web que es. NO generes puntos clave, solo una descripción breve y concisa.

Formato de salida requerido:
---
DESCRIPCIÓN: [descripción básica del portal en máximo 150 caracteres]
---

Contenido a analizar:
${contentText}

Ejemplos de descripciones:
- "Portal de noticias especializado en tecnología y innovación"
- "Tienda en línea de productos electrónicos y gadgets"
- "Blog personal sobre desarrollo web y programación"
- "Red social para compartir fotos y videos"

Responde solo con el formato especificado, sin introducción ni explicación.`;

    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    if (GROQ_API_KEY) {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Eres un asistente que describe portales web de manera concisa.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullText = data.choices?.[0]?.message?.content?.trim() || '';

        const descriptionMatch = fullText.match(/DESCRIPCIÓN:\s*([\s\S]*)/i);
        const summary = descriptionMatch ? descriptionMatch[1].trim() : 'Portal web general';

        return { summary, keyPoints: [] };
      }
    }

    return { summary: 'Portal web general', keyPoints: [] };
  } catch (error) {
    console.error('Error analyzing portal URL:', error);
    return { summary: 'Portal web general', keyPoints: [] };
  }
}

export async function analyzeUrlWithKeyPoints(url: string): Promise<{ summary: string; keyPoints: string[] }> {
  try {
    const html = await fetchHtmlWithProxy(url);
    const sections = await extractContentFromUrl(html, url);

    if (sections.length === 0) {
      return { summary: '', keyPoints: [] };
    }

    const contentText = sections.map(s => s.content).join(' ').slice(0, 8000);

    const prompt = `Analiza el siguiente contenido de una página web y genera:

1. RESUMEN: Una descripción breve (máximo 200 caracteres) que explique de qué trata.
2. 5 PUNTOS CLAVE: Lista exactamente 5 puntos clave en formato de viñetas que capturen la información más importante.

Formato de salida requerido:
---
RESUMEN: [tu resumen aquí]
PUNTOS CLAVE:
1. [Punto 1 - Acción/Sujeto principal]
2. [Punto 2 - Datos o cifras]
3. [Punto 3 - Contexto o causa]
4. [Punto 4 - Consecuencia o impacto]
5. [Punto 5 - Conclusión o siguiente paso]
---

Contenido a analizar:
${contentText}

Responde solo con el formato especificado, sin introduce ni explain.`;

    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    if (GROQ_API_KEY) {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Eres un asistente que analiza contenido web y genera resúmenes estructurados con 5 puntos clave.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullText = data.choices?.[0]?.message?.content?.trim() || '';
        
        const summaryMatch = fullText.match(/RESUMEN:\s*([\s\S]*?)(?:PUNTOS CLAVE:|$)/i);
        const summary = summaryMatch ? summaryMatch[1].trim() : '';
        
        const keyPointsMatch = fullText.match(/PUNTOS CLAVE:\s*([\s\S]*)/i);
        let keyPoints: string[] = [];
        if (keyPointsMatch) {
          keyPoints = keyPointsMatch[1]
            .split('\n')
            .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 5);
        }

        return { summary, keyPoints };
      }
    }

    return { summary: 'Contenido procesado', keyPoints: ['Punto 1', 'Punto 2', 'Punto 3', 'Punto 4', 'Punto 5'] };
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return { summary: '', keyPoints: [] };
  }
}

export async function analyzeUrlContent(url: string): Promise<string> {
  try {
    const html = await fetchHtmlWithProxy(url);
    const sections = await extractContentFromUrl(html, url);

    if (sections.length === 0) {
      return '';
    }

    const contentText = sections.map(s => s.content).join(' ').slice(0, 8000);

    const prompt = `Analiza el siguiente contenido de una página web. IMPORTANTE: Si es un artículo específico o noticia, el resumen debe enfocarse en el CONTENIDO ESPECÍFICO (80%) y solo una breve mención de la fuente (20%).

Regla: "Foco en el Contenido Específico"
- Si la URL contiene un artículo/noticia específica → resumir DE QUÉ TRATA ese artículo en particular
- Si es la página principal/portal general → resumir QUÉ TIPO DE portal es

Formato esperado para ARTÍCULO:
"Título del artículo. [Publicador]. Ideal para seguir temas de [tema]."

Formato esperado para PORTAL:
"Portal de [tipo]. Fuente de información sobre [temas]. [Agregar si es regional/nacional]."

Contenido a analizar:
${contentText}

Responde solo con la descripción, máximo 250 caracteres, sé específico y basado en el contenido real.`;

    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    if (GROQ_API_KEY) {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Eres un asistente que genera descripciones breves y útiles de sitios web.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 400,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data.choices?.[0]?.message?.content?.trim() || '';
        return summary;
      }
    }

    return `Sitio web analizado. Tipo: ${sections[0]?.lang || 'desconocido'}. Contenido disponible para procesamiento.`;
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return '';
  }
}