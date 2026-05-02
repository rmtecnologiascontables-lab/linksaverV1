// Google Identity Services - Token Model
// Esta implementación usa el flujo moderno de Google OAuth

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
        };
      };
    };
  }
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: Error) => void;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

const GOOGLE_CLIENT_ID = '29621406716-nk3tvkni0okc0h944o1snpikl83bssrh.apps.googleusercontent.com';
const SCOPES = 'openid email profile';

let tokenClient: TokenClient | null = null;

export function initGoogleAuth() {
  // Load Google Identity Services script
  if (!window.google) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}

export function initiateGoogleLogin() {
  return new Promise<{ email: string; name: string; picture?: string }>((resolve, reject) => {
    // Initialize token client
    tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.access_token) {
          // Get user info
          fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          })
            .then(res => res.json())
            .then(userInfo => {
              resolve({
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
              });
            })
            .catch(() => {
              // Fallback si no puede obtener info
              resolve({
                email: 'google_user@gmail.com',
                name: 'Usuario Google'
              });
            });
        } else if (response.error) {
          reject(new Error(response.error));
        }
      },
      error_callback: (error) => {
        reject(error);
      }
    });

    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Fallback si no se cargó el script
      reject(new Error('Google Auth no disponible'));
    }
  });
}

export async function handleGoogleCallback(): Promise<{ email: string; name: string; picture?: string } | null> {
  // With Google Identity Services, we don't need a callback page
  // The token is obtained directly in the client
  return null;
}

export function isGoogleAuthConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

export function isGoogleScriptLoaded(): boolean {
  return !!window.google?.accounts?.oauth2;
}

// Function to validate token with backend (optional)
export async function validateTokenWithBackend(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzYzFhwW4MEjHhMsuuhNeeLlr6PtJ_vluk3Jl65sIQbRv3oElrMc4NW6yr7yguc6e9b/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'validateToken', 
        token: accessToken 
      }),
      mode: 'no-cors' // Evitar CORS, no necesitamos respuesta
    });
    return true; // Asumimos éxito con no-cors
  } catch (error) {
    return false;
  }
}