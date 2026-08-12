import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { apiFetch } from '../utils/api';

const EmployeeDetailPanel = ({ employeeId }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employeeId) return;

    const fetchEmployee = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/employees/${employeeId}`);
        setEmployee(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load employee details.');
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <aside className="hidden lg:block w-72 min-h-screen border-r border-gray-200 bg-white px-5 py-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Employee Detail
      </h3>

      {/* Empty state */}
      {!employeeId && !loading && (
        <p className="text-sm text-gray-400">
          Click a card to view full details.
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="h-4 w-4 animate-spin text-cyan-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading…
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Employee detail */}
      {!loading && !error && employee && (
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center">
            <img
              src={employee.image}
              alt={`${employee.firstname} ${employee.lastname}`}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-cyan-100"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  employee.firstname + ' ' + employee.lastname
                )}&background=06b6d4&color=fff`;
              }}
            />
            <p className="mt-3 text-base font-semibold text-gray-900">
              {employee.firstname} {employee.lastname}
            </p>
            <span className="mt-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700">
              {employee.job}
            </span>
          </div>

          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            <DetailRow label="Email" value={employee.email} />
            <DetailRow label="Phone" value={employee.phone} />
            <DetailRow label="Joined" value={formatDate(employee.dateOfJoining)} />
          </div>
        </div>
      )}
    </aside>
  );
};

EmployeeDetailPanel.propTypes = {
  employeeId: PropTypes.string,
};

const DetailRow = ({ label, value }) => (
  <div className="px-4 py-3">
    <p className="text-xs font-medium text-gray-400">{label}</p>
    <p className="mt-0.5 text-sm text-gray-800 break-all">{value || '—'}</p>
  </div>
);

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

export default EmployeeDetailPanel;
