import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MdSearch, MdDelete, MdExpandMore, MdExpandLess } from 'react-icons/md';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { HistorySkeleton } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import ConfidenceBadge from '../components/chat/ConfidenceBadge';
import CategoryBadge from '../components/documents/CategoryBadge';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import useDebounce from '../hooks/useDebounce';
import { clientConfig } from '../config/clientConfig';

const ChatHistory = () => {
  const { user }    = useAuth();
  const isAdmin     = user?.role === 'admin';

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination]   = useState(null);
  const [page, setPage]         = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);

  const debouncedSearch = useDebounce(searchInput);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: clientConfig.pageSize });
      if (debouncedSearch) params.set('q', debouncedSearch);
      const res = await apiFetch(`/chat/history?${params}`);
      setConversations(res.data);
      setPagination(res.pagination ?? null);
    } catch (err) {
      toast.error(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  // Reset page on new search
  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this conversation?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/chat/history/${id}`, { method: 'DELETE' });
      if (expanded === id) setExpanded(null);
      fetchHistory();
      toast.success('Conversation deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalCount = pagination?.total ?? conversations.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin ? 'All HR Copilot conversations.' : 'Your HR Copilot conversations.'}
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-5 max-w-sm">
            <MdSearch size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              aria-label="Search conversations"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions or answers…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {pagination && (
              <span className="ml-3 text-xs text-gray-400" aria-live="polite">
                {totalCount} result{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Skeleton */}
          {loading && <HistorySkeleton rows={6} />}

          {/* Empty */}
          {!loading && conversations.length === 0 && (
            <div className="py-20 text-center text-sm text-gray-400" role="status">
              {debouncedSearch ? 'No conversations match your search.' : 'No conversation history yet.'}
            </div>
          )}

          {/* List */}
          {!loading && conversations.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Conversation history">
              {conversations.map((conv) => (
                <ConversationRow
                  key={conv._id}
                  conv={conv}
                  isAdmin={isAdmin}
                  isExpanded={expanded === conv._id}
                  onToggle={() => setExpanded(expanded === conv._id ? null : conv._id)}
                  onDelete={() => handleDelete(conv._id)}
                  deleting={deletingId === conv._id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination && pagination.pages > 1 && (
            <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
          )}
        </div>
      </div>
    </div>
  );
};

const ConversationRow = ({ conv, isAdmin, isExpanded, onToggle, onDelete, deleting }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" role="listitem">
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
    >
      {isExpanded
        ? <MdExpandLess size={18} aria-hidden="true" className="shrink-0 text-gray-400" />
        : <MdExpandMore size={18} aria-hidden="true" className="shrink-0 text-gray-400" />}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{conv.question}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">{formatDate(conv.createdAt)}</span>
          <ConfidenceBadge confidence={conv.confidence} />
          {isAdmin && conv.userId?.fullName && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {conv.userId.fullName}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        disabled={deleting}
        aria-label="Delete conversation"
        title="Delete conversation"
        className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
      >
        {deleting
          ? <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          : <MdDelete size={16} aria-hidden="true" />}
      </button>
    </div>

    {isExpanded && (
      <div className="border-t border-gray-100 px-4 py-4 space-y-4">
        <section aria-label="Question">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Question</p>
          <p className="text-sm text-gray-800">{conv.question}</p>
        </section>
        <section aria-label="Answer">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Answer</p>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{conv.answer}</p>
        </section>
        {conv.retrievedSources?.length > 0 && (
          <section aria-label="Sources">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Sources</p>
            <div className="flex flex-wrap gap-2">
              {conv.retrievedSources.map((src, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-xs">
                  <CategoryBadge category={src.category} />
                  <span className="font-medium text-gray-700">{src.document}</span>
                  <span className="text-gray-400">#{src.chunkIndex}</span>
                  <span className="font-mono text-gray-400">{Math.round((src.score ?? 0) * 100)}%</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )}
  </div>
);

ConversationRow.propTypes = {
  conv: PropTypes.object.isRequired, isAdmin: PropTypes.bool.isRequired,
  isExpanded: PropTypes.bool.isRequired, onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired, deleting: PropTypes.bool.isRequired,
};

export default ChatHistory;
