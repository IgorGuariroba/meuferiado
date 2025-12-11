# 🚀 Guia de Integração Frontend Next.js com Backend NestJS (JWT)

Este guia mostra como configurar seu frontend Next.js para autenticar com Google OAuth e acessar as rotas protegidas do backend.

## 📋 Pré-requisitos

1. Backend NestJS rodando em `http://localhost:3000`
2. Next.js instalado e configurado
3. Credenciais OAuth do Google configuradas

## 🔧 Configuração

### 1. Variáveis de Ambiente (.env.local)

Crie um arquivo `.env.local` na raiz do projeto Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu_google_client_id_aqui
```

### 2. Instalar Dependências

```bash
npm install axios
# ou
yarn add axios
```

## 📁 Estrutura de Arquivos

```
src/
├── lib/
│   └── api.ts          # Cliente API com interceptors
├── hooks/
│   └── useAuth.ts      # Hook para gerenciar autenticação
├── context/
│   └── AuthContext.tsx # Context para estado de autenticação
├── pages/
│   ├── api/
│   │   └── auth/
│   │       └── callback.ts  # Callback do Google OAuth
│   └── login.ts        # Página de login
└── components/
    └── ProtectedRoute.tsx  # Componente para rotas protegidas
```

## 💻 Código de Implementação

### 1. Cliente API (`src/lib/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Hook de Autenticação (`src/hooks/useAuth.ts`)

```typescript
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setAuthState({
          user: null,
          token: null,
          loading: false,
          isAuthenticated: false,
        });
        return;
      }

      // Verificar se o token é válido fazendo uma requisição
      const response = await api.get('/auth/me');
      setAuthState({
        user: response.data,
        token: token,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      // Token inválido ou expirado
      localStorage.removeItem('jwt_token');
      setAuthState({
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = () => {
    // Redirecionar para o endpoint de autenticação do backend
    // O backend detecta automaticamente se é uma requisição do frontend através do Referer header
    // ou através do parâmetro redirect_uri codificado no state
    const frontendUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUri = `${frontendUrl}/auth/callback`;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      // Ignorar erros no logout
    } finally {
      localStorage.removeItem('jwt_token');
      setAuthState({
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      });
      window.location.href = '/login';
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return {
    ...authState,
    login,
    logout,
    getUserProfile,
    checkAuth,
  };
}
```

### 3. Context de Autenticação (`src/context/AuthContext.tsx`)

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  getUserProfile: () => Promise<any>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
```

### 4. Página de Callback (`src/pages/auth/callback.tsx`)

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token && typeof token === 'string') {
      // Armazenar token no localStorage
      localStorage.setItem('jwt_token', token);

      // Redirecionar para página inicial ou dashboard
      router.push('/');
    } else {
      router.push('/login?error=invalid_token');
    }
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processando autenticação...</p>
      </div>
    </div>
  );
}
```

### 6. Página de Login (`src/pages/login.tsx`)

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const { isAuthenticated, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <button
          onClick={login}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
        >
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
```

### 7. Componente de Rota Protegida (`src/components/ProtectedRoute.tsx`)

```typescript
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### 8. Exemplo de Uso em uma Página (`src/pages/profile.tsx`)

```typescript
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Sair
            </button>
          </div>

          {loading ? (
            <p>Carregando...</p>
          ) : (
            <div>
              {user && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Dados do Token</h2>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Nome:</strong> {user.name}</p>
                  {user.picture && (
                    <img src={user.picture} alt="Avatar" className="w-20 h-20 rounded-full mt-2" />
                  )}
                </div>
              )}

              {profile && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Dados Completos do Banco</h2>
                  <p><strong>ID:</strong> {profile._id}</p>
                  <p><strong>Google ID:</strong> {profile.googleId}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Nome:</strong> {profile.name}</p>
                  <p><strong>Provedor:</strong> {profile.provider}</p>
                  <p><strong>Criado em:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

### 9. Configurar _app.tsx (`src/pages/_app.tsx`)

```typescript
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

## 🔄 Fluxo de Autenticação

1. **Usuário clica em "Entrar com Google"** → Redireciona para `/auth/google?redirect_uri=http://localhost:3001/auth/callback` do backend
2. **Backend redireciona para Google** → Usuário faz login no Google
3. **Google redireciona para callback do backend** → Backend detecta `redirect_uri` e gera JWT
4. **Backend redireciona para frontend** → `/auth/callback?token=JWT_TOKEN`
5. **Frontend recebe token** → Armazena no `localStorage` e redireciona para página inicial
6. **Requisições autenticadas** → Token é enviado automaticamente no header `Authorization: Bearer ...`

## ⚙️ Configuração do Backend para Frontend

### 1. No arquivo `.env` do backend, adicione:

```env
FRONTEND_URL=http://localhost:3001
```

### 2. No Google Cloud Console:

Adicione os redirect URIs autorizados:
- `http://localhost:3000/auth/google/callback` (backend - já configurado)
- `http://localhost:3001/auth/callback` (frontend - desenvolvimento)
- `https://seudominio.com/auth/callback` (frontend - produção)

**Importante:** O backend já está configurado para detectar requisições do frontend através do parâmetro `redirect_uri` e redirecionar corretamente.

## 📝 Notas Importantes

1. **CORS**: O backend já está configurado para aceitar requisições do frontend
2. **Token Storage**: O token é armazenado no `localStorage` (considere usar cookies httpOnly em produção)
3. **Refresh Token**: Atualmente não há refresh token, mas você pode implementar se necessário
4. **Segurança**: Em produção, considere:
   - Usar cookies httpOnly em vez de localStorage
   - Implementar refresh tokens
   - Adicionar CSRF protection

## 🧪 Testando

1. Acesse `http://localhost:3001/login`
2. Clique em "Entrar com Google"
3. Faça login com sua conta Google
4. Você será redirecionado de volta e poderá acessar rotas protegidas

