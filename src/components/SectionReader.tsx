import { useState, useEffect } from 'react';
import { Play, Pause, FileText, Zap, Globe } from 'lucide-react';
import type { ContentSection } from '@/lib/contentExtractor';

interface Props {
  sections: ContentSection[];
}

type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;
type Language = 'es-MX' | 'en-US';

const SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 2];
const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'es-MX', label: 'Español' },
  { value: 'en-US', label: 'English' },
];

export function SectionReader({ sections }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [selectedLang, setSelectedLang] = useState<Language>('es-MX');
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const detectedLang = sections[0]?.lang || 'es-MX';
    setSelectedLang(detectedLang);
  }, [sections]);

  const handleSpeak = (section: ContentSection) => {
    window.speechSynthesis.cancel();

    if (activeId === section.id) {
      setActiveId(null);
      return;
    }

    const utter = new SpeechSynthesisUtterance(section.content);
    utter.lang = selectedLang;
    utter.rate = speed;
    utter.onend = () => setActiveId(null);
    utter.onerror = () => setActiveId(null);

    window.speechSynthesis.speak(utter);
    setUtterance(utter);
    setActiveId(section.id);
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <div className="p-3 border-b border-[#1f1f1f] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white">Contenido Detectado</h3>
            <p className="text-xs text-[#666]">{sections.length} partes</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#111] border border-[#222]">
            <Globe className="w-3.5 h-3.5 text-[#666] shrink-0" />
            <div className="flex gap-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setSelectedLang(l.value)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                    selectedLang === l.value
                      ? 'bg-green-600 text-white'
                      : 'text-[#666] hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#111] border border-[#222]">
            <Zap className="w-3.5 h-3.5 text-[#666] shrink-0" />
            <div className="flex gap-0.5">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    if (utterance) utterance.rate = s;
                  }}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                    speed === s
                      ? 'bg-blue-600 text-white'
                      : 'text-[#666] hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[250px] overflow-y-auto p-2 space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleSpeak(section)}
            className={`w-full p-4 rounded-lg border text-left transition-all duration-200 group ${
              activeId === section.id
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-[#1f1f1f] hover:border-[#333] bg-[#0c0c0c]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[#e5e5e5] group-hover:text-white truncate">
                  {section.title}
                </h4>
                <p className="text-xs text-[#666] mt-1 line-clamp-2 leading-relaxed">
                  {section.preview}
                </p>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  activeId === section.id
                    ? 'bg-blue-600'
                    : 'bg-[#1f1f1f] group-hover:bg-blue-600/20'
                }`}
              >
                {activeId === section.id ? (
                  <Pause className="w-3.5 h-3.5 fill-white text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeId && (
        <div className="p-3 border-t border-[#1f1f1f] bg-[#0f0f0f]">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-[#666]">Reproduciendo...</span>
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setActiveId(null);
              }}
              className="text-xs text-blue-500 hover:text-blue-400"
            >
              Detener
            </button>
          </div>
        </div>
      )}
    </div>
  );
}