import { useState } from 'react';
import PropTypes from 'prop-types';
import { MdClose, MdThumbUp, MdThumbDown } from 'react-icons/md';

const FeedbackModal = ({ rating, onSubmit, onClose }) => {
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(rating, comment.trim());
    setSubmitting(false);
  };

  const isHelpful = rating === 'helpful';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            {isHelpful
              ? <MdThumbUp size={18} className="text-green-600" />
              : <MdThumbDown size={18} className="text-red-500" />}
            <h2 className="text-sm font-semibold text-gray-900">
              {isHelpful ? 'Glad it helped!' : 'Sorry to hear that'}
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <MdClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isHelpful ? 'What did you find useful? (optional)' : 'What was missing or wrong? (optional)'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={isHelpful ? 'This answered my question about…' : "The answer didn't cover…"}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/500</p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-3">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Skip
            </button>
            <button type="submit" disabled={submitting}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 transition-colors ${
                isHelpful ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
              }`}>
              {submitting ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

FeedbackModal.propTypes = {
  rating:   PropTypes.oneOf(['helpful', 'not_helpful']).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose:  PropTypes.func.isRequired,
};

export default FeedbackModal;
