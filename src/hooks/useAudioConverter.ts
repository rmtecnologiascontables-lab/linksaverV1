import { useCallback, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type Bitrate = '128k' | '192k' | '320k';

const CORE_VERSION = '0.11.6';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// Use jsdelivr which allows CORS
const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

export interface ConversionItem {
  id: string;
  name: string;
  outName: string;
  size: number;
  status: 'queued' | 'loading' | 'converting' | 'done' | 'error';
  progress: number;
  url?: string;
  error?: string;
  bitrate: Bitrate;
  isUrl?: boolean;
  sourceUrl?: string;
}

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    const limitMb = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `El archivo "${file.name}" (${mb}MB) excede el límite de ${limitMb}MB` };
  }
  return { valid: true };
}

export function useAudioConverter() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ready, setReady] = useState(false);
  const [loadingCore, setLoadingCore] = useState(false);
  const [items, setItems] = useState<ConversionItem[]>([]);
  const currentIdRef = useRef<string | null>(null);

  const ensureLoaded = useCallback(async () => {
    if (ffmpegRef.current) {
      if (ready) return ffmpegRef.current;
      if (loadingCore) return null; // Already loading
    }
    
    setLoadingCore(true);
    const ffmpeg = ffmpegRef.current ?? new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on('progress', ({ progress }) => {
      const id = currentIdRef.current;
      if (!id) return;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, progress: Math.min(99, Math.round(progress * 100)) } : it,
        ),
      );
    });

    try {
      console.log('Loading FFmpeg from:', baseURL);
      
      const loadPromise = ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 30000)
      );
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      console.log('FFmpeg loaded successfully');
      setReady(true);
      setLoadingCore(false);
      return ffmpeg;
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      setLoadingCore(false);
      return null;
    }
  }, []);

  const enqueue = useCallback((files: File[], bitrate: Bitrate) => {
    const next: ConversionItem[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2, 10),
      name: f.name,
      outName: f.name.replace(/\.[^.]+$/, '') + '.mp3',
      size: f.size,
      status: 'queued',
      progress: 0,
      bitrate,
    }));
    setItems((prev) => [...next, ...prev]);
    return { items: next, files };
  }, []);

  const enqueueUrl = useCallback((url: string, bitrate: Bitrate) => {
    const name = url.split('/').pop() || 'audio_from_url';
    const cleanName = name.split('?')[0];
    const id = Math.random().toString(36).slice(2, 10);
    const item: ConversionItem = {
      id,
      name: cleanName,
      outName: cleanName.replace(/\.[^.]+$/, '') + '.mp3',
      size: 0,
      status: 'loading',
      progress: 0,
      bitrate,
      isUrl: true,
      sourceUrl: url,
    };
    setItems((prev) => [item, ...prev]);
    return { item, url };
  }, []);

  const convert = useCallback(
    async (files: File[], bitrate: Bitrate) => {
      const { items: queued } = enqueue(files, bitrate);
      const ffmpeg = await ensureLoaded();
      
      if (!ffmpeg) {
        setItems((prev) => prev.map((it) => 
          queued.find(q => q.id === it.id) 
            ? { ...it, status: 'error', error: 'Error cargando motor de conversión' }
            : it
        ));
        return;
      }

      for (let i = 0; i < queued.length; i++) {
        const item = queued[i];
        const file = files[i];
        currentIdRef.current = item.id;
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'converting' } : it)));
        try {
          const inputName = `in_${item.id}`;
          const outputName = `out_${item.id}.mp3`;
          await ffmpeg.writeFile(inputName, await fetchFile(file));
          await ffmpeg.exec(['-i', inputName, '-vn', '-b:a', bitrate, '-ar', '44100', outputName]);
          const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
          // Copy into a fresh ArrayBuffer to avoid SharedArrayBuffer/typing issues with Blob
          const buf = new Uint8Array(data.byteLength);
          buf.set(data);
          const blob = new Blob([buf], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          await ffmpeg.deleteFile(inputName).catch(() => {});
          await ffmpeg.deleteFile(outputName).catch(() => {});
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, status: 'done', progress: 100, url } : it,
            ),
          );
        } catch (e) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: 'error', error: e instanceof Error ? e.message : 'Error' }
                : it,
            ),
          );
        }
      }
      currentIdRef.current = null;
    },
    [enqueue, ensureLoaded],
  );

  const convertFromUrl = useCallback(
    async (url: string, bitrate: Bitrate) => {
      const { item } = enqueueUrl(url, bitrate);
      const ffmpeg = await ensureLoaded();
      
      if (!ffmpeg) {
        setItems((prev) => prev.map((it) => 
          it.id === item.id 
            ? { ...it, status: 'error', error: 'Error cargando motor de conversión' }
            : it
        ));
        return;
      }
      
      currentIdRef.current = item.id;
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'converting' } : it)));
      try {
        const inputName = `in_${item.id}`;
        const outputName = `out_${item.id}.mp3`;
        await ffmpeg.writeFile(inputName, await fetchFile(url));
        await ffmpeg.exec(['-i', inputName, '-vn', '-b:a', bitrate, '-ar', '44100', outputName]);
        const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
        const buf = new Uint8Array(data.byteLength);
        buf.set(data);
        const blob = new Blob([buf], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        await ffmpeg.deleteFile(inputName).catch(() => {});
        await ffmpeg.deleteFile(outputName).catch(() => {});
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'done', progress: 100, url: blobUrl, size: blob.size } : it,
          ),
        );
      } catch (e) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', error: e instanceof Error ? e.message : 'Error al descargar' }
              : it,
          ),
        );
      }
      currentIdRef.current = null;
    },
    [enqueueUrl, ensureLoaded],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.url) URL.revokeObjectURL(it.url);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it.url && URL.revokeObjectURL(it.url));
      return [];
    });
  }, []);

  return { ready, loadingCore, items, convert, convertFromUrl, remove, clearAll, ensureLoaded, validateFileSize };
}
