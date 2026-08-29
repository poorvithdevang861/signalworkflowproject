import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { SnackbarProvider } from './context/SnackbarContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import PlatformRBAC from './pages/platform/PlatformRBAC';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SnackbarProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'data_architect', 'data_manager', 'executive']}>
                  <PermissionsProvider>
                    <MainLayout />
                  </PermissionsProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route
                path="dashboard"
                element={<Dashboard />}
              />
              <Route
                path="platform-rbac"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                    <PlatformRBAC />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SnackbarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
