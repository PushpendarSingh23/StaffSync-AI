import PropTypes from 'prop-types';
import CategoryBadge from '../documents/CategoryBadge';

/**
 * Renders a single source reference beneath an AI answer.
 * Shows document title, category badge, chunk number, and similarity score.
 */
const SourceCard = ({ source, index }) => {
  const scorePercent = Math.round((source.score ?? 0) * 100);

  // Colour the score bar green/yellow/red based on value
  const barColor =
    scorePercent >= 85 ? 'bg-green-400' :
    scorePercent >= 70 ? 'bg-yellow-400' :
    'bg-red-400';

  return (
    <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-sm">
      {/* Index number */}
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-800">{source.document}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <CategoryBadge category={source.category} />
          <span className="text-gray-400">chunk #{source.chunkIndex}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-mono text-gray-500">{scorePercent}%</span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

SourceCard.propTypes = {
  source: PropTypes.shape({
    document:   PropTypes.string.isRequired,
    category:   PropTypes.string.isRequired,
    chunkIndex: PropTypes.number.isRequired,
    score:      PropTypes.number.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export default SourceCard;
