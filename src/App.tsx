import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/authSlice";
import { useStore } from "./store/useStore";
import { getUserProfile } from "./lib/googleSheetsDB";
import Index from "./pages/Index.tsx";
import SplashPage from "./pages/SplashPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import AuthCallback from "./components/AuthCallback.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AuthFlow() {
  const { showSplash, showAuth, isAuthenticated, login } = useAuthStore();
  const updateProfile = useStore((s) => s.updateProfile);

  const handleSplashComplete = () => {
    useAuthStore.getState().setShowSplash(false);
    useAuthStore.getState().setShowAuth(true);
  };

  const handleLogin = async (user: { email: string; name: string; company?: string }) => {
    login(user);
    localStorage.setItem('rm-brain-user-email', user.email);
    
    // Load full profile from backend
    try {
      const profile = await getUserProfile(user.email);
      if (profile) {
        updateProfile({
          name: profile.name || '',
          company: profile.company || '',
          industry: profile.industry || '',
          website: profile.website || '',
          tone: (profile.tone as any) || 'casual',
          language: profile.language || 'Español',
          audience: profile.audience || '',
          audiencePains: '',
          preferredFormats: [],
          preferredLength: (profile.preferredLength as any) || 'medio',
          keywords: profile.keywords ? profile.keywords.split(',').map(k => k.trim()) : [],
          bannedTopics: profile.bannedTopics ? profile.bannedTopics.split(',').map(t => t.trim()) : [],
          styleExamples: profile.styleExamples || '',
        });
        console.log('✅ Perfil cargado desde backend');
      }
    } catch (error) {
      console.error('Error loading profile from backend:', error);
    }
  };

  if (showSplash) {
    return <SplashPage onComplete={handleSplashComplete} />;
  }

  if (showAuth && !isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthFlow />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;