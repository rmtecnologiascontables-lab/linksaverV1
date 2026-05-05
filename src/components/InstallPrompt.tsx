import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      setInstalled(true);
      return;
    }

    const dismissedBefore = localStorage.getItem('rm_brain_install_dismissed');
    if (dismissedBefore) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      setTimeout(() => {
        if (!dismissed && !installed) {
          setShow(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed, installed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstalled(true);
      setShow(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('rm_brain_install_dismissed', 'true');
  };

  if (installed || !show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50"
      >
        <div className="glass-strong rounded-2xl p-4 shadow-xl border border-primary/20">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Añadir RM Brain a pantalla de inicio</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Acceso rápido y experiencia nativa sin abrir el navegador.
              </p>
              <button
                onClick={handleInstall}
                className="w-full h-9 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 shadow-glow hover:opacity-95 transition"
              >
                <Download className="w-4 h-4" />
                Instalar ahora
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}