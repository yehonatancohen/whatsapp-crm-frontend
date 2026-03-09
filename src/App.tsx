import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { Accounts } from './components/Accounts';
import { ContactsPage } from './pages/ContactsPage';
import { WarmupPage } from './pages/WarmupPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <AppLayout />
                  </AuthGuard>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="warmup" element={<WarmupPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin/users" element={<AdminUsersPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
