import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authSlice';
import { handleGoogleCallback } from '@/lib/googleAuth';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const user = await handleGoogleCallback();
        if (user) {
          login({ email: user.email, name: user.name });
          navigate('/', { replace: true });
        } else {
          setError('No se pudo completar el login');
        }
      } catch (err) {
        setError('Error al procesar el callback');
      }
    };

    processCallback();
  }, [navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <a href="/" className="text-primary hover:underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completando login...</p>
      </div>
    </div>
  );
}

export default AuthCallback;