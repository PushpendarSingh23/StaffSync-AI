import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Sidebar from '../components/Sidebar';
import { StatCardsSkeleton } from '../components/ui/Skeleton';
import { apiFetch } from '../utils/api';

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
                '#3b82f6', '#f97316', '#6366f1', '#14b8a6', '#ec4899'];

const Analytics = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    apiFetch('/admin/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mb-6 text-sm text-gray-500">Platform-wide usage metrics for the last 30 days.</p>

          {loading && <StatCardsSkeleton count={5} />}

          {error && (
            <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && data && (
            <>
              {/* ── Summary cards ───────────────────────────────────────────── */}
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Conversations"   value={data.summary.totalConversations} color="cyan" />
                <StatCard label="Documents"        value={data.summary.totalDocuments}     color="purple" />
                <StatCard label="Vector Chunks"    value={data.summary.totalChunks}        color="amber" />
                <StatCard label="Users"            value={data.summary.totalUsers}         color="green" />
                <StatCard
                  label="Avg Confidence"
                  value={`${Math.round(data.summary.avgConfidenceScore * 100)}%`}
                  color="blue"
                />
              </div>

              {/* ── Feedback summary row ────────────────────────────────────── */}
              <div className="mb-8 flex flex-wrap gap-4">
                <FeedbackCard
                  label="👍 Helpful"
                  count={data.feedbackBreakdown[0]?.value ?? 0}
                  pct={data.summary.helpfulPct}
                  bg="bg-green-50"
                  text="text-green-700"
                />
                <FeedbackCard
                  label="👎 Not Helpful"
                  count={data.feedbackBreakdown[1]?.value ?? 0}
                  pct={data.summary.notHelpfulPct}
                  bg="bg-red-50"
                  text="text-red-700"
                />
                <FeedbackCard
                  label="Total Feedback"
                  count={data.summary.totalFeedback}
                  pct={null}
                  bg="bg-gray-50"
                  text="text-gray-700"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* ── Daily AI usage (last 30 days) ──────────────────────────── */}
                <ChartCard title="Daily AI Usage — Last 30 Days">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.dailyUsage} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }}
                        tickFormatter={(v) => v.slice(5)} /* MM-DD */
                        interval={Math.floor(data.dailyUsage.length / 6)} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(val) => [val, 'Conversations']}
                      />
                      <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2}
                        fill="url(#usageGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* ── Feedback ratio pie ─────────────────────────────────────── */}
                <ChartCard title="Feedback Ratio">
                  {data.summary.totalFeedback === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
                      No feedback yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.feedbackBreakdown}
                          dataKey="value"
                          nameKey="label"
                          cx="50%" cy="50%"
                          outerRadius={80}
                          label={({ label, pct }) => `${label} ${pct}%`}
                          labelLine
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12 }}
                          formatter={(val, name) => [val, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* ── Top HR categories ─────────────────────────────────────── */}
                <ChartCard title="Top Referenced HR Categories">
                  {data.topCategories.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.topCategories} layout="vertical"
                        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="count" name="References" radius={[0, 4, 4, 0]}>
                          {data.topCategories.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* ── Top referenced documents ──────────────────────────────── */}
                <ChartCard title="Top Referenced Documents">
                  {data.topDocuments.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.topDocuments} layout="vertical"
                        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="document" tick={{ fontSize: 10 }} width={130}
                          tickFormatter={(v) => v.length > 18 ? `${v.slice(0, 17)}…` : v} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="count" name="References" radius={[0, 4, 4, 0]}>
                          {data.topDocuments.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* ── Confidence distribution ───────────────────────────────── */}
                <ChartCard title="Confidence Distribution">
                  {data.confidenceDistribution.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.confidenceDistribution}
                          dataKey="count"
                          nameKey="confidence"
                          cx="50%" cy="50%"
                          outerRadius={80}
                          label={({ confidence, count }) => `${confidence} (${count})`}
                        >
                          {data.confidenceDistribution.map((entry) => {
                            const c = entry.confidence === 'high' ? '#10b981'
                              : entry.confidence === 'medium' ? '#f59e0b' : '#ef4444';
                            return <Cell key={entry.confidence} fill={c} />;
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Small presentational helpers ─────────────────────────────────────────────

const COLOR_CLASS = {
  cyan:   'text-cyan-600',
  purple: 'text-purple-600',
  amber:  'text-amber-600',
  green:  'text-green-600',
  blue:   'text-blue-600',
};

const StatCard = ({ label, value, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${COLOR_CLASS[color] ?? 'text-gray-900'}`}>
      {value}
    </p>
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};

const FeedbackCard = ({ label, count, pct, bg, text }) => (
  <div className={`flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 ${bg}`}>
    <div>
      <p className={`text-sm font-semibold ${text}`}>{label}</p>
      <p className="mt-0.5 text-xs text-gray-500">
        {count} rating{count !== 1 ? 's' : ''}{pct !== null ? ` · ${pct}%` : ''}
      </p>
    </div>
  </div>
);

FeedbackCard.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  pct:   PropTypes.number,
  bg:    PropTypes.string.isRequired,
  text:  PropTypes.string.isRequired,
};

const ChartCard = ({ title, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
    {children}
  </div>
);

ChartCard.propTypes = {
  title:    PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Analytics;
