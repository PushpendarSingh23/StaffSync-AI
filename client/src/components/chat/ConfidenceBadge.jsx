import PropTypes from 'prop-types';

const CONFIG = {
  high:   { label: 'High confidence',   className: 'bg-green-50 text-green-700 border-green-200' },
  medium: { label: 'Medium confidence', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  low:    { label: 'Low confidence',    className: 'bg-red-50 text-red-700 border-red-200' },
};

const ConfidenceBadge = ({ confidence }) => {
  const cfg = CONFIG[confidence] ?? CONFIG.low;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

ConfidenceBadge.propTypes = {
  confidence: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
};

export default ConfidenceBadge;
