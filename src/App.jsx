import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import AdminGate from '@/components/AdminGate';

import Welcome from '@/pages/Welcome';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import BookDetail from '@/pages/BookDetail';
import Reader from '@/pages/Reader';
import Chat from '@/pages/Chat';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import ArchiveAdmin from '@/pages/ArchiveAdmin';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route path="/" element={<Welcome />} />
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
