import { useCallback, useEffect, useRef, useState } from 'react';

// Tipos mínimos para Web Speech API (no están en lib.dom por defecto)
type SR = any;

export interface UseSpeechRecorderOptions {
  lang?: string;
  onError?: (msg: string) => void;
}

export function useSpeechRecorder(opts: UseSpeechRecorderOptions = {}) {
  const { lang = 'es-ES', onError } = opts;
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [interim, setInterim] = useState('');
  const [transcript, setTranscript] = useState('');

  const recogRef = useRef<SR | null>(null);
  const finalRef = useRef('');
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const wantRunningRef = useRef(false);

  useEffect(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!Ctor);
  }, []);

  const startTimer = () => {
    startedAtRef.current = Date.now() - elapsed * 1000;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
  };
  const stopTimer = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const buildRecognition = useCallback(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return null;
    const r: SR = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e: any) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          finalRef.current += (finalRef.current ? ' ' : '') + res[0].transcript.trim();
        } else {
          interimText += res[0].transcript;
        }
      }
      setInterim(interimText);
      setTranscript(finalRef.current);
    };
    r.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      onError?.(e.error || 'error desconocido');
    };
    r.onend = () => {
      // Web Speech corta solo cada cierto tiempo; reiniciamos si seguimos grabando
      if (wantRunningRef.current) {
        try { r.start(); } catch { /* ya corriendo */ }
      }
    };
    return r;
  }, [lang, onError]);

  const start = useCallback(async () => {
    if (!supported) { onError?.('Tu navegador no soporta grabación de voz. Prueba Chrome o Edge.'); return; }
    try {
      // Forzar permiso explícito
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      onError?.('Permiso de micrófono denegado.');
      return;
    }
    finalRef.current = '';
    setTranscript('');
    setInterim('');
    setElapsed(0);
    const r = buildRecognition();
    if (!r) return;
    recogRef.current = r;
    wantRunningRef.current = true;
    try { r.start(); } catch {}
    setRecording(true);
    setPaused(false);
    startTimer();
  }, [buildRecognition, onError, supported]);

  const pause = useCallback(() => {
    if (!recogRef.current || !recording || paused) return;
    wantRunningRef.current = false;
    try { recogRef.current.stop(); } catch {}
    setPaused(true);
    stopTimer();
  }, [paused, recording]);

  const resume = useCallback(() => {
    if (!recording || !paused) return;
    const r = buildRecognition();
    if (!r) return;
    recogRef.current = r;
    wantRunningRef.current = true;
    try { r.start(); } catch {}
    setPaused(false);
    startTimer();
  }, [buildRecognition, paused, recording]);

  const stop = useCallback(() => {
    wantRunningRef.current = false;
    if (recogRef.current) {
      try { recogRef.current.stop(); } catch {}
      recogRef.current = null;
    }
    stopTimer();
    setRecording(false);
    setPaused(false);
    setInterim('');
    return finalRef.current.trim();
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setInterim('');
    setElapsed(0);
  }, []);

  useEffect(() => () => { wantRunningRef.current = false; if (recogRef.current) try { recogRef.current.stop(); } catch {}; stopTimer(); }, []);

  return { supported, recording, paused, elapsed, interim, transcript, start, pause, resume, stop, reset, setTranscript };
}
