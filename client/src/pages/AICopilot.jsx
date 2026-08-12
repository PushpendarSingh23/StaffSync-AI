import { useState, useRef, useCallback } from 'react';
import { MdSend, MdDeleteSweep } from 'react-icons/md';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/chat/ChatMessage';
import TypingIndicator from '../components/chat/TypingIndicator';
import SuggestedQuestions from '../components/chat/SuggestedQuestions';
import useChatScroll from '../hooks/useChatScroll';
import { apiFetch } from '../utils/api';

let msgId = 0;
const newMsg = (role, content, extras = {}) => ({
  id: ++msgId,
  role,
  content,
  timestamp: Date.now(),
  ...extras,
});

const makeSessionId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const AICopilot = () => {
  const [messages, setMessages]                 = useState([]);
  const [input, setInput]                       = useState('');
  // `loading` spans the whole request (disables input, drives the typing dots).
  const [loading, setLoading]                   = useState(false);
  const inputRef                                = useRef(null);
  const bottomRef                                = useChatScroll(messages);

  // One sessionId per open chat window/tab — groups turns into a multi-turn
  // memory thread server-side. Reset whenever the chat is cleared.
  const sessionIdRef = useRef(makeSessionId());

  const sendQuestion = useCallback(async (question) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, newMsg('user', trimmed)]);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      const { data } = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ question: trimmed, sessionId: sessionIdRef.current }),
      });

      setMessages((prev) => [
        ...prev,
        newMsg('assistant', data.answer, {
          sources: data.sources,
          confidence: data.confidence,
          conversationId: data.conversationId,
        }),
      ]);
    } catch (err) {
      const errMsg = err.message || 'Something went wrong. Please try again.';
      toast.error(errMsg);
      setMessages((prev) => [...prev, newMsg('error', errMsg)]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleSubmit  = (e) => { e.preventDefault(); sendQuestion(input); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(input); }
  };

  const handleClear = () => {
    if (!messages.length) return;
    if (!window.confirm('Clear the chat?')) return;
    sessionIdRef.current = makeSessionId(); // fresh memory thread for the next conversation
    setMessages([]);
    setLoading(false);
  };

  const hasMessages = messages.length > 0;
  const visibleMessages = messages;
  const showTyping = loading;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600 text-base font-bold text-white">AI</div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">HR Copilot</h1>
              <p className="text-xs text-gray-500">Powered by your HR knowledge base</p>
            </div>
          </div>
          {hasMessages && (
            <button type="button" onClick={handleClear}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              <MdDeleteSweep size={16} /> Clear
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {!hasMessages ? (
            <SuggestedQuestions onSelect={sendQuestion} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {visibleMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {showTyping && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
          {hasMessages && !showTyping && <div ref={bottomRef} className="h-px" />}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask an HR question… (Enter to send, Shift+Enter for new line)"
                rows={1}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60"
                style={{ maxHeight: '140px', overflowY: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                }}
              />
            </div>
            <button type="submit" disabled={!input.trim() || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send">
              {loading ? (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <MdSend size={18} />
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-gray-400">
            Answers are grounded in your HR documents. Always verify important policies with HR.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;
