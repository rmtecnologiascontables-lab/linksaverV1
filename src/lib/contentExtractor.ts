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