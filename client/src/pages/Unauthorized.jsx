import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50 px-4 text-center">
    <p className="text-7xl font-black text-gray-200">403</p>
    <h1 className="mt-4 text-2xl font-bold text-gray-900">Access denied</h1>
    <p className="mt-2 text-sm text-gray-500 max-w-xs">
      You do not have permission to view this page.
    </p>
    <Link
      to="/dashboard"
      className="mt-6 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors"
    >
      Back to Dashboard
    </Link>
  </div>
);

export default Unauthorized;
