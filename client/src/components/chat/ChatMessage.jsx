import { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MdContentCopy, MdCheck, MdThumbUp, MdThumbDown } from 'react-icons/md';
import toast from 'react-hot-toast';
import SourceCard from './SourceCard';
import ConfidenceBadge from './ConfidenceBadge';
import FeedbackModal from './FeedbackModal';
import { apiFetch } from '../../utils/api';

const ChatMessage = ({ message }) => {
  const { role, content, sources, confidence, timestamp, conversationId } = message;
  const [copied, setCopied]             = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // 'helpful' | 'not_helpful'
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingRating, setPendingRating]         = useState(null);

  const isUser  = role === 'user';
  const isError = role === 'error';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* non-HTTPS env */ }
  };

  const handleFeedbackClick = (rating) => {
    if (!conversationId) return;
    if (feedbackGiven) { toast('You already rated this answer.', { icon: 'ℹ️' }); return; }
    setPendingRating(rating);
    setShowFeedbackModal(true);
  };

  const submitFeedback = async (rating, comment) => {
    try {
      await apiFetch('/chat/feedback', {
        method: 'POST',
        body: JSON.stringify({ conversationId, rating, comment }),
      });
      setFeedbackGiven(rating);
      toast.success(rating === 'helpful' ? 'Thanks for the feedback! 👍' : 'Thanks — we\'ll use this to improve. 👎');
    } catch (err) {
      toast.error(err.message || 'Failed to save feedback.');
    } finally {
      setShowFeedbackModal(false);
      setPendingRating(null);
    }
  };

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* AI avatar */}
        {!isUser && (
          <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
            AI
          </div>
        )}

        <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
          {/* Bubble */}
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-cyan-600 text-white'
              : isError
              ? 'rounded-tl-sm border border-red-200 bg-red-50 text-red-700'
              : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800 shadow-sm'
          }`}>
            {isUser ? (
              <p>{content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul:     ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                  ol:     ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                  li:     ({ children }) => <li>{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code:   ({ children }) => (
                    <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">
                      {children}
                    </code>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>

          {/* Meta row */}
          <div className={`flex flex-wrap items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {formattedTime && <span className="text-xs text-gray-400">{formattedTime}</span>}

            {!isUser && !isError && (
              <button type="button" onClick={handleCopy} title="Copy answer"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                {copied ? <MdCheck size={13} className="text-green-500" /> : <MdContentCopy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}

            {!isUser && confidence && <ConfidenceBadge confidence={confidence} />}

            {/* Feedback buttons — only for persisted AI answers */}
            {!isUser && !isError && conversationId && (
              <div className="flex items-center gap-1">
                <button type="button"
                  onClick={() => handleFeedbackClick('helpful')}
                  title="Helpful"
                  disabled={!!feedbackGiven}
                  className={`rounded p-1 text-xs transition-colors disabled:cursor-default ${
                    feedbackGiven === 'helpful'
                      ? 'text-green-600'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}>
                  <MdThumbUp size={14} />
                </button>
                <button type="button"
                  onClick={() => handleFeedbackClick('not_helpful')}
                  title="Not helpful"
                  disabled={!!feedbackGiven}
                  className={`rounded p-1 text-xs transition-colors disabled:cursor-default ${
                    feedbackGiven === 'not_helpful'
                      ? 'text-red-600'
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}>
                  <MdThumbDown size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Sources */}
          {!isUser && !isError && sources && sources.length > 0 && (
            <div className="mt-1 w-full space-y-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sources</p>
              {sources.map((src, i) => (
                <SourceCard key={`${src.document}-${src.chunkIndex}`} source={src} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* User avatar */}
        {isUser && (
          <div className="ml-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
            Me
          </div>
        )}
      </div>

      {showFeedbackModal && (
        <FeedbackModal
          rating={pendingRating}
          onSubmit={submitFeedback}
          onClose={() => { setShowFeedbackModal(false); setPendingRating(null); }}
        />
      )}
    </>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role:           PropTypes.oneOf(['user', 'assistant', 'error']).isRequired,
    content:        PropTypes.string.isRequired,
    sources:        PropTypes.array,
    confidence:     PropTypes.string,
    timestamp:      PropTypes.number,
    conversationId: PropTypes.string,
  }).isRequired,
};

export default ChatMessage;
