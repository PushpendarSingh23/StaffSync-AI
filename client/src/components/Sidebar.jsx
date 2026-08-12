import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard, MdMenuBook, MdPerson, MdSmartToy,
  MdHistory, MdBarChart, MdMenu, MdClose,
} from 'react-icons/md';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

// ── Shared nav links config ───────────────────────────────────────────────────
const useNavLinks = (isAdmin) => [
  { to: '/dashboard',  icon: <MdDashboard size={18} aria-hidden="true" />, label: 'Dashboard' },
  { to: '/documents',  icon: <MdMenuBook  size={18} aria-hidden="true" />, label: 'Knowledge Base' },
  { to: '/copilot',    icon: <MdSmartToy  size={18} aria-hidden="true" />, label: 'HR Copilot' },
  { to: '/history',    icon: <MdHistory   size={18} aria-hidden="true" />, label: 'Chat History' },
  ...(isAdmin ? [{ to: '/analytics', icon: <MdBarChart size={18} aria-hidden="true" />, label: 'Analytics' }] : []),
  { to: '/profile',    icon: <MdPerson    size={18} aria-hidden="true" />, label: 'Profile' },
];

// ── Link item ─────────────────────────────────────────────────────────────────
const SidebarLink = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 ${
        isActive ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`
    }
  >
    {icon}
    {label}
  </NavLink>
);

SidebarLink.propTypes = {
  to: PropTypes.string.isRequired, icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired, onClick: PropTypes.func,
};

// ── User badge ────────────────────────────────────────────────────────────────
const UserBadge = ({ user }) => (
  <div className="mt-auto px-4 pt-6">
    <p className="truncate text-xs font-medium text-gray-500">{user?.fullName}</p>
    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
      user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
    }`}>
      {user?.role}
    </span>
  </div>
);
UserBadge.propTypes = { user: PropTypes.object };

// ── Main Sidebar component ────────────────────────────────────────────────────
const Sidebar = () => {
  const { user }    = useAuth();
  const isAdmin     = user?.role === 'admin';
  const links       = useNavLinks(isAdmin);
  const [open, setOpen] = useState(false);
  const location    = useLocation();
  const drawerRef   = useRef(null);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Trap focus / close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    // Move focus into drawer
    drawerRef.current?.querySelector('a')?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white py-6">
        <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
          {links.map((l) => <SidebarLink key={l.to} {...l} />)}
        </nav>
        <UserBadge user={user} />
      </aside>

      {/* ── Mobile hamburger button ───────────────────────────────────────── */}
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-sidebar"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg lg:hidden focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
      >
        <MdMenu size={22} aria-hidden="true" />
      </button>

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <aside
        id="mobile-sidebar"
        ref={drawerRef}
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white py-6 shadow-xl transition-transform duration-200 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-4">
          <span className="text-base font-bold text-gray-900">StaffSync</span>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <MdClose size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3" aria-label="Mobile main navigation">
          {links.map((l) => <SidebarLink key={l.to} {...l} onClick={() => setOpen(false)} />)}
        </nav>
        <UserBadge user={user} />
      </aside>
    </>
  );
};

export default Sidebar;
