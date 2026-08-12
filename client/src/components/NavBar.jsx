import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Signed out.');
    navigate('/login');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="text-lg font-bold text-white hover:text-cyan-400 transition-colors"
        >
          StaffSync
        </Link>

        <div className="flex items-center gap-2">
          {/* Home — always visible */}
          <NavLink to="/" active={isActive('/')}>
            Home
          </NavLink>

          {user ? (
            <>
              {/* Dashboard — all authenticated users */}
              <NavLink to="/dashboard" active={isActive('/dashboard')}>
                Dashboard
              </NavLink>

              {/* Knowledge Base — all authenticated users */}
              <NavLink to="/documents" active={isActive('/documents')}>
                Knowledge Base
              </NavLink>

              {/* HR Copilot — all authenticated users */}
              <NavLink to="/copilot" active={isActive('/copilot')}>
                HR Copilot
              </NavLink>

              {/* Chat History */}
              <NavLink to="/history" active={isActive('/history')}>
                History
              </NavLink>

              {/* Analytics — admin only */}
              {user.role === 'admin' && (
                <NavLink to="/analytics" active={isActive('/analytics')}>
                  Analytics
                </NavLink>
              )}

              {/* Profile */}
              <NavLink to="/profile" active={isActive('/profile')}>
                Profile
              </NavLink>

              {/* Role badge */}
              <span
                className={`hidden sm:inline rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  user.role === 'admin'
                    ? 'bg-purple-600 text-white'
                    : 'bg-cyan-600 text-white'
                }`}
              >
                {user.role}
              </span>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 hover:border-white hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {/* Not logged in */}
              <NavLink to="/login" active={isActive('/login')}>
                Sign in
              </NavLink>
              <Link
                to="/register"
                className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, active, children }) => (
  <Link
    to={to}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-white text-black' : 'text-gray-300 hover:text-white'
    }`}
  >
    {children}
  </Link>
);

import PropTypes from 'prop-types';

NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default NavBar;
