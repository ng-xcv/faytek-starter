import { Suspense, lazy } from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import AuthGuard from '../guards/AuthGuard';
import GuestGuard from '../guards/GuestGuard';
import DashboardLayout from '../layouts/dashboard';

// ─── Loadable ────────────────────────────────────────────────────────────
const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// ─── Pages ───────────────────────────────────────────────────────────────
const Login = Loadable(lazy(() => import('../pages/auth/Login')));
const DashboardHome = Loadable(lazy(() => import('../pages/dashboard/DashboardHome')));
const UserList = Loadable(lazy(() => import('../pages/users/UserList')));
const UserNewEdit = Loadable(lazy(() => import('../pages/users/UserNewEdit')));
const Page404 = Loadable(lazy(() => import('../pages/Page404')));

// ─── Router ──────────────────────────────────────────────────────────────
export default function Router() {
  return useRoutes([
    {
      path: '/auth/login',
      element: (
        <GuestGuard>
          <Login />
        </GuestGuard>
      ),
    },
    {
      path: '/dashboard',
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { index: true, element: <Navigate to="home" replace /> },
        { path: 'home', element: <DashboardHome /> },
        { path: 'users/list', element: <UserList /> },
        { path: 'users/new', element: <UserNewEdit /> },
        { path: 'users/:id/edit', element: <UserNewEdit /> },
      ],
    },
    { path: '/', element: <Navigate to="/auth/login" replace /> },
    { path: '/404', element: <Page404 /> },
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
