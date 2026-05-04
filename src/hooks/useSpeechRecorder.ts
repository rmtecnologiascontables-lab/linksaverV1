import { useCallback, useEffect, useRef, useState } from 'react';

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
  
  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Start audio recording
  const startAudioRecording = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Collect chunks every second
      mediaRecorderRef.current = mediaRecorder;
      
      return stream;
    } catch (err) {
      console.error('Error starting audio recording:', err);
      return null;
    }
  };

  // Stop audio recording and return the audio blob
  const stopAudioRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(new Blob([], { type: 'audio/webm' }));
        return;
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        
        resolve(audioBlob);
      };
      
      mediaRecorderRef.current.stop();
    });
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
      if (wantRunningRef.current) {
        try { r.start(); } catch { /* ya corriendo */ }
      }
    };
    return r;
  }, [lang, onError]);

  const start = useCallback(async () => {
    if (!supported) { onError?.('Tu navegador no soporta grabación de voz. Prueba Chrome o Edge.'); return; }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError?.('Permiso de micrófono denegado.');
      return;
    }
    finalRef.current = '';
    setTranscript('');
    setInterim('');
    setElapsed(0);
    
    // Start audio recording
    await startAudioRecording();
    
    const r = buildRecognition();
    if (!r) return;
    recogRef.current = r;
    wantRunningRef.current = true;
    try { r.start(); } catch {}
    setRecording(true);
    setPaused(false);
    startTimer();
  }, [buildRecognition, onError, supported]);

  const pause = useCallback(async () => {
    if (!recogRef.current || !recording || paused) return;
    
    // Pause audio recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    
    wantRunningRef.current = false;
    try { recogRef.current.stop(); } catch {}
    setPaused(true);
    stopTimer();
  }, [paused, recording]);

  const resume = useCallback(async () => {
    if (!recording || !paused) return;
    
    // Resume audio recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    
    const r = buildRecognition();
    if (!r) return;
    recogRef.current = r;
    wantRunningRef.current = true;
    try { r.start(); } catch {}
    setPaused(false);
    startTimer();
  }, [buildRecognition, paused, recording]);

  const stop = useCallback(async () => {
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

  const stopAndGetAudio = useCallback(async () => {
    wantRunningRef.current = false;
    
    // Detener el reconocimiento de voz si está activo
    if (recogRef.current) {
      try { recogRef.current.stop(); } catch {}
      recogRef.current = null;
    }
    
    stopTimer();
    setRecording(false);
    setPaused(false);
    setInterim('');
    
    // Pequeña espera para asegurar que el audio se procesó
    await new Promise(r => setTimeout(r, 100));
    
    // Get the audio blob
    const audioBlob = await stopAudioRecording();
    
    const transcript = finalRef.current.trim();
    console.log('🎤 Grabación detenida. Transcripción:', transcript.substring(0, 100));
    
    return {
      transcript,
      audioBlob
    };
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setInterim('');
    setElapsed(0);
    audioChunksRef.current = [];
  }, []);

  useEffect(() => () => { 
    wantRunningRef.current = false; 
    if (recogRef.current) try { recogRef.current.stop(); } catch {}; 
    stopTimer(); 
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  return { 
    supported, 
    recording, 
    paused, 
    elapsed, 
    interim, 
    transcript, 
    start, 
    pause, 
    resume, 
    stop: stopAndGetAudio, 
    reset, 
    setTranscript,
    getAudioBlob: () => new Blob(audioChunksRef.current, { type: 'audio/webm' })
  };
}