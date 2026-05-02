// Heurística simple para extraer 5 puntos clave de una transcripción.
// Sin backend: divide en oraciones, puntúa por longitud + palabras clave + posición,
// y devuelve los 5 mejores en el orden original del texto.

const STOP = new Set([
  'el','la','los','las','un','una','unos','unas','de','del','y','o','u','que','en','a','al',
  'es','por','para','con','sin','se','su','sus','lo','le','les','me','te','nos','mi','tu',
  'pero','como','más','muy','ya','si','no','sí','también','este','esta','eso','esto','esa',
  'the','a','an','of','and','or','to','in','on','for','with','is','are','was','were','be',
  'this','that','it','as','but','by','at','from','i','you','we','they','he','she',
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((w) => w && !STOP.has(w) && w.length > 2);
}

export function summarizeToBullets(transcript: string, n = 5): string[] {
  const sentences = splitSentences(transcript);
  if (sentences.length <= n) return sentences.length ? sentences : fallbackChunks(transcript, n);

  // Frecuencia de términos
  const freq = new Map<string, number>();
  sentences.forEach((s) => tokenize(s).forEach((w) => freq.set(w, (freq.get(w) || 0) + 1)));

  const scored = sentences.map((s, i) => {
    const words = tokenize(s);
    const score = words.reduce((acc, w) => acc + (freq.get(w) || 0), 0) / Math.max(words.length, 1);
    // Bonus por estar al inicio o al final (suelen contener tesis/conclusión)
    const positionBonus = i < 2 || i >= sentences.length - 2 ? 1.15 : 1;
    return { s, i, score: score * positionBonus };
  });

  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, n);
  top.sort((a, b) => a.i - b.i);
  return top.map((t) => normalize(t.s));
}

function fallbackChunks(text: string, n: number): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const size = Math.max(40, Math.ceil(clean.length / n));
  const chunks: string[] = [];
  for (let i = 0; i < clean.length && chunks.length < n; i += size) {
    chunks.push(normalize(clean.slice(i, i + size)));
  }
  return chunks;
}

function normalize(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.endsWith('.') || t.endsWith('!') || t.endsWith('?') ? t : t + '.';
}

export function autoTitle(transcript: string): string {
  const first = splitSentences(transcript)[0] || transcript.slice(0, 60);
  const t = first.replace(/[.!?]+$/, '').trim();
  return (t.length > 64 ? t.slice(0, 61) + '…' : t) || 'Nota de voz';
}
