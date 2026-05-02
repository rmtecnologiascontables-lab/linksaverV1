import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export function SplashPage({ onComplete }: Props) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showContent) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [showContent, onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-primary grid place-items-center shadow-glow"
        >
          <Brain className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: showContent ? 1 : 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold tracking-tight"
        >
          <span className="text-gradient">RM</span> Brain
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: showContent ? 1 : 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-lg text-muted-foreground mt-2"
        >
          Tu Asistente de Productividad Intelligent
        </motion.p>

        {/* Company Credits */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: showContent ? 1 : 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-12"
        >
          <div className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              © 2026 <span className="font-semibold text-foreground">RM TECNOLOGÍAS CONTABLES</span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground/60 mt-2">
            Todos los derechos reservados
          </div>
        </motion.div>

        {/* Loading indicator */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ delay: 1.5 }}
        onClick={onComplete}
        className="absolute bottom-8 right-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        Skip <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

export default SplashPage;