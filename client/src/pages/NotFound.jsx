import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50 px-4 text-center">
    <p className="text-7xl font-black text-gray-200">404</p>
    <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
    <p className="mt-2 text-sm text-gray-500 max-w-xs">
      The page you are looking for does not exist or has been moved.
    </p>
    <Link
      to="/"
      className="mt-6 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors"
    >
      Go home
    </Link>
  </div>
);

export default NotFound;
