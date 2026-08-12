import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header band */}
          <div className="h-24 bg-gradient-to-r from-cyan-500 to-cyan-700" />

          {/* Avatar + name */}
          <div className="-mt-12 flex flex-col items-center px-8 pb-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-600 text-2xl font-bold text-white ring-4 ring-white">
              {initials}
            </div>

            <h1 className="mt-4 text-xl font-bold text-gray-900">{user.fullName}</h1>
            <span
              className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${
                user.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-cyan-100 text-cyan-700'
              }`}
            >
              {user.role}
            </span>

            {/* Detail rows */}
            <div className="mt-8 w-full divide-y divide-gray-100 rounded-xl border border-gray-200">
              <Row label="Email" value={user.email} />
              <Row label="Account ID" value={user._id} mono />
              {user.employeeId && (
                <Row label="Employee record" value={String(user.employeeId)} mono />
              )}
              <Row label="Member since" value={formatDate(user.createdAt)} />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 px-5 py-4">
    <span className="shrink-0 text-sm font-medium text-gray-500">{label}</span>
    <span
      className={`text-right text-sm text-gray-900 break-all ${
        mono ? 'font-mono text-xs' : ''
      }`}
    >
      {value}
    </span>
  </div>
);

import PropTypes from 'prop-types';

Row.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  mono: PropTypes.bool,
};

export default Profile;
