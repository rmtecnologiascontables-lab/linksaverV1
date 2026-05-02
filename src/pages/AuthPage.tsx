import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Mail, Lock, User, Building, Globe, ArrowLeft, Chrome, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isSheetConfigured, registerUser, loginUser, registerGoogleUser } from '@/lib/googleSheetsDB';
import { initiateGoogleLogin, isGoogleScriptLoaded, initGoogleAuth } from '@/lib/googleAuth';

interface AuthUser {
  email: string;
  name: string;
  company?: string;
}

interface Props {
  onLogin: (user: AuthUser) => void;
}

const DEMO_USER = {
  email: 'demo@rmbrain.app',
  name: 'Usuario Demo',
  company: 'RM Studio',
  industry: 'Software / Creator Economy',
  website: 'https://rm.studio',
  audience: 'Developers y creadores digitales 25-40',
  tone: 'casual',
  language: 'Español',
  preferredLength: 'medio',
  keywords: 'IA, Productividad, Developer Experience',
  bannedTopics: '',
  styleExamples: 'Frases cortas. Una idea por línea.',
};

export function AuthPage({ onLogin }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Handle Google OAuth callback
  useEffect(() => {
    // Initialize Google Identity Services script
    initGoogleAuth();
  }, []);

  const handleGoogleAuthClick = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await initiateGoogleLogin();
      
      // Save user to Google Sheets
      const saved = await registerGoogleUser(user.email, user.name);
      if (saved) {
        console.log('✅ Usuario guardado en Google Sheets');
      } else {
        console.log('⚠️ No se pudo guardar en Sheets (pero login exitoso)');
      }
      
      toast.success('¡Bienvenido con Google!');
      onLogin({ email: user.email, name: user.name, company: '' });
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error?.type === 'popup_closed') {
        toast.error('Ventana cerrada. Intenta de nuevo.');
      } else if (error?.type === 'access_denied') {
        toast.error('Authorization cancelada.');
      } else {
        toast.error('Error al iniciar con Google');
      }
    }
    setIsGoogleLoading(false);
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    website: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDemoLogin = () => {
    toast.success('🎮 Entrando en modo demo...');
    onLogin({
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      company: DEMO_USER.company,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.password) {
        toast.error('Por favor completa todos los campos');
        setIsLoading(false);
        return;
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        setIsLoading(false);
        return;
      }

      if (!isLogin && !formData.name) {
        toast.error('El nombre es requerido');
        setIsLoading(false);
        return;
      }

      // Check if DB is configured
      if (!isSheetConfigured()) {
        // Demo mode - accept any login
        toast.success(`¡Bienvenido${formData.name ? ' ' + formData.name.split(' ')[0] : ''}! (Modo demo)`);
        onLogin({
          email: formData.email,
          name: formData.name || formData.email.split('@')[0],
          company: formData.company,
        });
        setIsLoading(false);
        return;
      }

      // Real authentication with Google Sheets
      if (isLogin) {
        const user = await loginUser(formData.email, formData.password);
        if (user) {
          toast.success('¡Bienvenido de nuevo!');
          onLogin({
            email: user.email,
            name: user.name || user.email.split('@')[0],
            company: user.company,
          });
        } else {
          toast.error('Email o contraseña incorrectos');
        }
      } else {
        const success = await registerUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          company: formData.company,
          website: formData.website,
        });
        if (success) {
          toast.success('¡Cuenta creada! Bienvenido a RM Brain');
          onLogin({
            email: formData.email,
            name: formData.name,
            company: formData.company,
          });
        } else {
          toast.error('Este email ya está registrado');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Error de conexión. Intenta de nuevo.');
    }

    setIsLoading(false);
  };

  const handleGoogleAuth = () => {
    if (isGoogleScriptLoaded()) {
      handleGoogleAuthClick();
    } else {
      // Fallback if script not loaded
      toast.info('Cargando Google Auth...');
      initGoogleAuth();
      setTimeout(() => {
        if (isGoogleScriptLoaded()) {
          handleGoogleAuthClick();
        } else {
          toast.error('No se pudo cargar Google Auth. Usa modo demo.');
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md relative z10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mb-4">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-gradient">RM</span> Brain
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          {/* Demo Mode Button */}
          <button
            onClick={handleDemoLogin}
            className="w-full mb-6 p-4 rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 transition group"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 grid place-items-center group-hover:scale-110 transition">
                <Play className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">🎮 Modo Demo</div>
                <div className="text-xs text-muted-foreground">Explora la app sin registrarte</div>
              </div>
            </div>
          </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="text-xs text-muted-foreground">Nombre completo</label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Contraseña</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={isLogin ? 'Tu contraseña' : 'Crea una contraseña'}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Confirmar contraseña</label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Repite tu contraseña"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Empresa (opcional)</label>
                      <div className="relative mt-1">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Tu empresa"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Sitio web (opcional)</label>
                      <div className="relative mt-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          name="website"
                          type="url"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://tu-sitio.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    isLogin ? 'Iniciar sesión' : 'Crear cuenta'
                  )}
                </Button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">o</span>
            </div>
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading}
            className="w-full h-11 rounded-xl border border-border bg-background hover:bg-muted flex items-center justify-center gap-3 transition disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <span className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            <span className="font-medium">
              {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
            </span>
          </button>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center text-sm">
            {isLogin ? (
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:underline font-medium"
                >
                  Regístrate gratis
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Iniciar sesión
                </button>
              </p>
            )}
          </div>

          {/* Company Credits */}
          <div className="mt-8 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 <span className="font-medium">RM TECNOLOGÍAS CONTABLES</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AuthPage;