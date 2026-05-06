import { useEffect, useState } from 'react';
import { AppShell, type TabKey } from '@/components/AppShell';
import { ContextualPage } from '@/pages/ContextualPage';
import { Dashboard } from '@/pages/Dashboard';
import { PromptStudio } from '@/pages/PromptStudio';
import { LibraryPage } from '@/pages/LibraryPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ToolkitPage } from '@/pages/ToolkitPage';
import { ConverterPage } from '@/pages/ConverterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useStore } from '@/store/useStore';

const Index = () => {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [preselect, setPreselect] = useState<string | null>(null);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    document.title = 'RM Brain — Asistente Creativo Contextual';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'RM Brain: tu segundo cerebro con IA. Captura recursos, destila ideas y genera contenido en tu estilo.');
    else {
      const m = document.createElement('meta'); m.name = 'description';
      m.content = 'RM Brain: tu segundo cerebro con IA. Captura recursos, destila ideas y genera contenido en tu estilo.';
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    // Light is the default Apple-like theme; only add .dark when explicitly chosen
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const sendToStudio = (id: string) => { setPreselect(id); setTab('studio'); };

  return (
    <AppShell active={tab} onChange={setTab}>
      {tab === 'contextual' && <ContextualPage onSendToStudio={sendToStudio} />}
      {tab === 'dashboard'  && <Dashboard onSendToStudio={sendToStudio} />}
      {tab === 'studio'     && <PromptStudio preselectedId={preselect} onConsumePreselect={() => setPreselect(null)} />}
      {tab === 'library'    && <LibraryPage onSendToStudio={sendToStudio} />}
      {tab === 'projects'   && <ProjectsPage onSendToStudio={sendToStudio} />}
      {tab === 'toolkit'    && <ToolkitPage />}
      {tab === 'converter'  && <ConverterPage />}
      {tab === 'settings'   && <SettingsPage />}
    </AppShell>
  );
};

export default Index;
