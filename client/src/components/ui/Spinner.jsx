import PropTypes from 'prop-types';

const Spinner = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex items-center justify-center gap-2 text-sm text-gray-500 ${className}`}>
    <svg
      className="h-5 w-5 animate-spin text-cyan-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
    {label}
  </div>
);

Spinner.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
};

export default Spinner;
