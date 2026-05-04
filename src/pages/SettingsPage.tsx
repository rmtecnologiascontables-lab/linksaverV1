import { useState } from 'react';
import { Download, RotateCcw, User, Users, Settings as SettingsIcon, Shield, Sun, Moon, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/authSlice';
import type { Tone, UserProfile } from '@/types';
import { toast } from 'sonner';
import { syncUserWithBackend } from '@/lib/googleSheetsDB';

const tones: Tone[] = ['formal', 'casual', 'técnico', 'persuasivo'];
const formats = ['Newsletter', 'Tweet', 'Blog', 'Video', 'Email', 'LinkedIn'];

export function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const resetLearnings = useStore((s) => s.resetLearnings);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const feedback = useStore((s) => s.feedback);
  const user = useAuthStore((s) => s.user);

  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saving, setSaving] = useState(false);
  
  // Estados locales para inputs de texto libre
  const [keywordsInput, setKeywordsInput] = useState(profile.keywords.join(', '));
  const [bannedInput, setBannedInput] = useState(profile.bannedTopics.join(', '));

  // Sincronizar cuando el profile cambia
  useState(() => {
    setKeywordsInput(profile.keywords.join(', '));
    setBannedInput(profile.bannedTopics.join(', '));
  });

  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    
    // Procesar palabras clave y temas prohibidos
    const processedDraft = {
      ...draft,
      keywords: keywordsInput.split(',').map((s) => s.trim()).filter(Boolean),
      bannedTopics: bannedInput.split(',').map((s) => s.trim()).filter(Boolean),
    };
    
    updateProfile(processedDraft);
    
    // Try to sync with Google Sheets if user is logged in
    if (user?.email) {
      try {
        const saved = await syncUserWithBackend(user.email, draft);
        if (saved) {
          console.log('✅ Perfil guardado en Google Sheets');
        }
      } catch (error) {
        console.error('Error sync:', error);
      }
    }
    
    toast.success('Preferencias guardadas');
    setSaving(false);
  };

  const exportPrefs = () => {
    const blob = new Blob([JSON.stringify({ profile: draft, feedback }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rm-brain-preferences.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado');
  };

  const toggleFormat = (f: string) => {
    const next = draft.preferredFormats.includes(f)
      ? draft.preferredFormats.filter((x) => x !== f)
      : [...draft.preferredFormats, f];
    set('preferredFormats', next);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Configuración y Perfil</h1>
        <p className="text-muted-foreground text-sm">Tu IA aprende de aquí. Cuanto más completes, mejores serán los outputs.</p>
      </header>

      <Section icon={<User className="w-4 h-4" />} title="Datos base">
        <Grid>
          <Field label="Nombre"><Input value={draft.name} onChange={(v) => set('name', v)} /></Field>
          <Field label="Empresa / Marca"><Input value={draft.company} onChange={(v) => set('company', v)} /></Field>
          <Field label="Industria"><Input value={draft.industry} onChange={(v) => set('industry', v)} /></Field>
          <Field label="Sitio web"><Input value={draft.website} onChange={(v) => set('website', v)} placeholder="https://..." /></Field>
        </Grid>
      </Section>

      <Section icon={<Users className="w-4 h-4" />} title="Audiencia objetivo">
        <Grid>
          <Field label="Idioma">
            <Input value={draft.language} onChange={(v) => set('language', v)} />
          </Field>
          <Field label="Tono">
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button key={t} onClick={() => set('tone', t)}
                  className={`px-3 py-1.5 rounded-xl text-xs capitalize transition-all ring-focus ${draft.tone === t ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </Grid>
        <Field label="Demografía / Buyer persona">
          <Textarea value={draft.audience} onChange={(v) => set('audience', v)} rows={2}/>
        </Field>
        <Field label="Dolores y objetivos">
          <Textarea value={draft.audiencePains} onChange={(v) => set('audiencePains', v)} rows={3}/>
        </Field>
      </Section>

      <Section icon={<SettingsIcon className="w-4 h-4" />} title="Preferencias de contenido">
        <Field label="Formatos preferidos">
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => {
              const active = draft.preferredFormats.includes(f);
              return (
                <button key={f} onClick={() => toggleFormat(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all ring-focus ${active ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}>
                  {f}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Longitud preferida">
          <div className="flex gap-2">
            {(['corto','medio','largo'] as const).map((l) => (
              <button key={l} onClick={() => set('preferredLength', l)}
                className={`flex-1 py-2 rounded-xl text-sm capitalize ring-focus ${draft.preferredLength === l ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground hover:text-foreground'}`}>
                {l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Palabras clave (separadas por coma)">
          <Input value={keywordsInput} onChange={(v) => setKeywordsInput(v)} placeholder="IA, Productividad, Marketing..." />
        </Field>
        <Field label="Temas prohibidos">
          <Input value={bannedInput} onChange={(v) => setBannedInput(v)} placeholder="crypto pump, política..." />
        </Field>
        <Field label="Ejemplos de estilo">
          <Textarea value={draft.styleExamples} onChange={(v) => set('styleExamples', v)} rows={3}
            placeholder="Pega 1-2 ejemplos de cómo escribes tú normalmente." />
        </Field>
      </Section>

      <Section icon={<Shield className="w-4 h-4" />} title="Privacidad & Apariencia">
        <Field label="Tema">
          <div className="flex gap-2">
            <button onClick={() => { setTheme('dark'); document.documentElement.classList.remove('light'); }}
className={`flex-1 h-11 rounded-xl text-sm flex items-center justify-center gap-2 ring-focus ${theme === 'dark' ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground'}`}>
              <Moon className="w-4 h-4" /> Oscuro
            </button>
            <button
              className={`flex-1 h-11 rounded-xl text-sm flex items-center justify-center gap-2 ring-focus ${theme === 'light' ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'glass text-muted-foreground'}`}>
              <Sun className="w-4 h-4" /> Claro
            </button>
          </div>
        </Field>
        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={exportPrefs} className="h-11 px-4 rounded-xl glass hover:text-accent flex items-center gap-2 text-sm ring-focus">
            <Download className="w-4 h-4" /> Exportar preferencias
          </button>
          <button
            onClick={() => { if (confirm('¿Resetear todos los aprendizajes (feedback)?')) { resetLearnings(); toast.success('Aprendizajes reseteados'); } }}
            className="h-11 px-4 rounded-xl glass hover:text-destructive flex items-center gap-2 text-sm ring-focus"
          >
            <RotateCcw className="w-4 h-4" /> Resetear aprendizajes
          </button>
        </div>
      </Section>

      <div className="sticky bottom-24 md:bottom-4 flex justify-end">
        <button onClick={save} disabled={saving}
          className="h-12 px-6 rounded-2xl bg-gradient-primary text-primary-foreground font-medium shadow-glow ring-focus disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: React.PropsWithChildren<{ icon: React.ReactNode; title: string }>) {
  return (
    <section className="glass-strong rounded-3xl p-6 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">{icon}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Grid({ children }: React.PropsWithChildren) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>; }
function Field({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-input/60 border border-border rounded-xl px-3.5 py-2.5 text-sm ring-focus" />;
}
function Textarea({ value, onChange, rows, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-input/60 border border-border rounded-xl p-3.5 text-sm ring-focus resize-none" />;
}
