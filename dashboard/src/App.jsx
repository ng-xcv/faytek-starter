import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import AuthGuard from './components/AuthGuard';
import GuestGuard from './components/GuestGuard';
import Login from './pages/auth/Login';
import Home from './pages/home/Home';
import Settings from './pages/settings/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
      <AuthProvider>
      <PermissionsProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestGuard>
                <Login />
              </GuestGuard>
            }
          />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            }
          />
          <Route
            path="/module/:moduleId"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <Settings />
              </AuthGuard>
            }
          />
        </Routes>
      </PermissionsProvider>
      </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
