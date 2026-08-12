import PropTypes from 'prop-types';

const SUGGESTED = [
  'How many annual leaves do I get?',
  'What is the work from home policy?',
  'Explain the insurance benefits.',
  'How do travel reimbursements work?',
  'Explain the appraisal process.',
];

/**
 * Grid of suggested question chips shown in the empty chat state.
 * Clicking a chip fires onSelect(question).
 */
const SuggestedQuestions = ({ onSelect }) => (
  <div className="flex flex-col items-center gap-4 py-8 px-4">
    {/* Hero */}
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100">
      <span className="text-3xl">🤖</span>
    </div>
    <div className="text-center">
      <h2 className="text-lg font-semibold text-gray-800">HR Copilot AI</h2>
      <p className="mt-1 text-sm text-gray-500">
        Ask me anything about your HR policies.
        <br />I answer only from your company documents.
      </p>
    </div>

    {/* Chips */}
    <div className="mt-2 flex flex-wrap justify-center gap-2">
      {SUGGESTED.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-100 hover:border-cyan-300"
        >
          {q}
        </button>
      ))}
    </div>
  </div>
);

SuggestedQuestions.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default SuggestedQuestions;
