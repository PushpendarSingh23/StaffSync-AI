import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import MainSection from '../components/MainSection/MainSection';
import EmployeeDetailPanel from '../components/EmployeeDetailPanel';
import Sidebar from '../components/Sidebar';
import { StatCardsSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { formatDate } from '../utils/formatters';

// ── Admin stat + activity panel ───────────────────────────────────────────────
const AdminOverview = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/admin/analytics')
      .then((res) => setData(res.data))
      .catch(() => { /* non-fatal — employee grid still shows */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 pb-0"><StatCardsSkeleton count={5} /></div>;
  if (!data)   return null;

  const { summary, recentActivity } = data;

  const stats = [
    { label: 'Employees',       value: summary.totalUsers,          color: 'cyan'   },
    { label: 'Documents',       value: summary.totalDocuments,      color: 'purple' },
    { label: 'Indexed Chunks',  value: summary.totalChunks,         color: 'amber'  },
    { label: 'AI Conversations',value: summary.totalConversations,  color: 'green'  },
    { label: 'Avg Confidence',  value: `${Math.round(summary.avgConfidenceScore * 100)}%`, color: 'blue' },
  ];

  const COLOR = {
    cyan:   'text-cyan-600',   purple: 'text-purple-600',
    amber:  'text-amber-600',  green:  'text-green-600',   blue: 'text-blue-600',
  };

  return (
    <div className="px-6 pt-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${COLOR[color]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {recentActivity && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ActivityPanel title="Recent Uploads" items={recentActivity.recentUploads}>
            {(item) => (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400">{item.category} · {formatDate(item.createdAt)}</p>
              </div>
            )}
          </ActivityPanel>

          <ActivityPanel title="Recent Questions" items={recentActivity.recentConversations}>
            {(item) => (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{item.question}</p>
                <p className="text-xs text-gray-400">{item.userId?.fullName ?? '—'} · {formatDate(item.createdAt)}</p>
              </div>
            )}
          </ActivityPanel>

          <ActivityPanel title="Recent Feedback" items={recentActivity.recentFeedback}>
            {(item) => (
              <div className="min-w-0 flex-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.rating === 'helpful' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.rating === 'helpful' ? '👍 Helpful' : '👎 Not Helpful'}
                </span>
                {item.comment && <p className="mt-0.5 truncate text-xs text-gray-500">{item.comment}</p>}
                <p className="text-xs text-gray-400">{item.userId?.fullName ?? '—'} · {formatDate(item.createdAt)}</p>
              </div>
            )}
          </ActivityPanel>
        </div>
      )}
    </div>
  );
};

const ActivityPanel = ({ title, items, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
    <div className="border-b border-gray-100 px-4 py-3">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    {(!items || items.length === 0) ? (
      <p className="px-4 py-6 text-center text-xs text-gray-400">No recent activity</p>
    ) : (
      <ul className="divide-y divide-gray-50">
        {items.map((item, i) => (
          <li key={item._id ?? i} className="flex items-start gap-3 px-4 py-3">
            {children(item)}
          </li>
        ))}
      </ul>
    )}
  </div>
);

ActivityPanel.propTypes = {
  title:    PropTypes.string.isRequired,
  items:    PropTypes.array,
  children: PropTypes.func.isRequired,
};

// ── Dashboard page ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [employeeId, setEmployeeId] = useState('');
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Admin-only overview section */}
        {isAdmin && <AdminOverview />}

        <div className="flex flex-1">
          <EmployeeDetailPanel employeeId={employeeId} />
          <div className="flex-1">
            <MainSection setEmployeeId={setEmployeeId} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
