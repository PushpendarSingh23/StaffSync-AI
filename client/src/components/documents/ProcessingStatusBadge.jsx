import PropTypes from 'prop-types';

/**
 * Renders a coloured pill for each document processing status.
 * Uses emoji indicators that work without icon dependencies.
 */
const STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    icon: '🟡',
    className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  },
  ready: {
    label: 'Ready',
    icon: '🟢',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  failed: {
    label: 'Failed',
    icon: '🔴',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
  archived: {
    label: 'Archived',
    icon: '⚫',
    className: 'bg-gray-50 text-gray-500 border border-gray-200',
  },
};

const ProcessingStatusBadge = ({ status, animate = false }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.processing;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <span
        className={
          status === 'processing' && animate ? 'animate-pulse' : undefined
        }
      >
        {config.icon}
      </span>
      {config.label}
    </span>
  );
};

ProcessingStatusBadge.propTypes = {
  status: PropTypes.oneOf(['processing', 'ready', 'failed', 'archived']).isRequired,
  animate: PropTypes.bool,
};

export default ProcessingStatusBadge;
