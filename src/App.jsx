import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import Welcome from '@/pages/Welcome';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import BookDetail from '@/pages/BookDetail';
import Reader from '@/pages/Reader';
import Chat from '@/pages/Chat';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import ArchiveAdmin from '@/pages/ArchiveAdmin';

const ADMIN_STORAGE_KEY = 'base44_admin_access';
const ADMIN_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE?.trim() || '271828';

const getAdminAccess = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
};

const setAdminAccess = (value) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (value) {
    window.localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    return;
  }
  window.localStorage.removeItem(ADMIN_STORAGE_KEY);
};

const RootRoute = () => {
  const [searchParams] = useSearchParams();
  const redirectedPath = searchParams.get('path');

  if (redirectedPath) {
    return <Navigate to={redirectedPath} replace />;
  }

  return <Welcome />;
};

const AdminGate = ({ children }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(() => getAdminAccess());

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (code.trim() === ADMIN_CODE) {
      setAdminAccess(true);
      setGranted(true);
      setCode('');
    } else {
      setAdminAccess(false);
      setError('Invalid admin code');
    }

    setLoading(false);
  };

  if (granted) {
    return children;
  }

  return (
    <PageContainer className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-5 h-5 text-primary" />
        <GoldHeading size="md">Archive Admin</GoldHeading>
      </div>

      <GlassCard className="p-5">
        <p className="text-sm text-muted-foreground mb-4">
          Enter the admin code to open the import tools.
        </p>

        {error ? (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              type="password"
              placeholder="Admin code"
              className="pl-10 h-12"
              autoComplete="off"
              autoFocus
              required
            />
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking code...
              </>
            ) : (
              'Open admin tools'
            )}
          </Button>
        </form>
      </GlassCard>
    </PageContainer>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/home" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/reader/:bookId" element={<Reader />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/archive-admin" element={<AdminGate><ArchiveAdmin /></AdminGate>} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
