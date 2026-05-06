import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, LayoutDashboard, Wand2, Library, Settings as SettingsIcon, Wrench, Music, ListChecks, LogOut, User, Moon, Sun, FolderOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ToDoXLPanel } from './ToDoXLPanel';
import { RRSearcher } from './RRSearcher';
import { QuickLinks } from './QuickLinks';
import { useTodoXLStore } from '@/store/todoXLSlice';
import { useQuickLinksStore } from '@/store/quickLinksSlice';
import { useAuthStore } from '@/store/authSlice';
import { useStore } from '@/store/useStore';

export type TabKey = 'contextual' | 'dashboard' | 'studio' | 'library' | 'projects' | 'toolkit' | 'converter' | 'settings';

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'contextual', label: 'RM Brain',      icon: Brain },
  { key: 'dashboard',  label: 'Inicio',        icon: LayoutDashboard },
  { key: 'studio',     label: 'Prompts',       icon: Wand2 },
  { key: 'library',    label: 'Biblioteca',    icon: Library },
  { key: 'projects',   label: 'Proyectos',     icon: FolderOpen },
  { key: 'toolkit',    label: 'Herramientas',  icon: Wrench },
  { key: 'converter',  label: 'Convertidor',   icon: Music },
  { key: 'settings',   label: 'Ajustes',       icon: SettingsIcon },
];

interface Props {
  active: TabKey;
  onChange: (k: TabKey) => void;
}

export function AppShell({ active, onChange, children }: React.PropsWithChildren<Props>) {
  const [todoOpen, setTodoOpen] = useState(false);
  const pendingCount = useTodoXLStore((s) => s.items.filter((i) => !i.done).length);
  const { links, setLinks } = useQuickLinksStore();
  const { user, logout } = useAuthStore();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const handleLogout = () => {
    logout();
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-semibold tracking-tight truncate">RM Brain</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Contextual AI</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 glass rounded-full p-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onChange(t.key)}
                  className="relative px-4 py-2 text-sm rounded-full ring-focus transition-colors"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-full bg-gradient-primary shadow-glow"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative flex items-center gap-2 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => setTodoOpen(true)}
            className="relative inline-flex items-center gap-2 h-10 px-3 md:px-4 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow hover:opacity-95 transition ring-focus shrink-0"
            aria-label="Abrir To Do XL"
          >
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Tareas</span>
            {pendingCount > 0 && (
              <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-background/90 text-foreground text-[10px] font-semibold grid place-items-center">
                {pendingCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full glass grid place-items-center text-muted-foreground hover:text-foreground transition ring-focus shrink-0"
              aria-label={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate max-w-[100px]">{user.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="h-10 px-3 rounded-full glass text-sm text-muted-foreground hover:text-foreground transition ring-focus shrink-0 flex items-center gap-2"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <RRSearcher />

      <QuickLinks links={links} onChange={setLinks} />

      <ToDoXLPanel open={todoOpen} onOpenChange={setTodoOpen} />

      <main className="flex-1 container py-6 md:py-10 pb-28 md:pb-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass-strong rounded-2xl p-1.5 flex justify-between shadow-elegant">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl ring-focus transition-colors ${isActive ? 'bg-gradient-primary text-primary-foreground' : 'text-muted-foreground'}`}
              aria-label={t.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
