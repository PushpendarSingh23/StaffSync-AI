import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-label="Loading">
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    );
  }

  // Unauthenticated → /login (preserves intended destination)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role → /unauthorized
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children:     PropTypes.node.isRequired,
  requiredRole: PropTypes.string,
};

export default ProtectedRoute;
