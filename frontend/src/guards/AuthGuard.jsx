import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingScreen from '../components/LoadingScreen';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
};
