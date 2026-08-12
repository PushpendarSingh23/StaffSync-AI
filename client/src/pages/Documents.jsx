import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MdUpload, MdSearch, MdEdit, MdDelete, MdDownload,
  MdFilterList, MdRefresh, MdPictureAsPdf,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { TableSkeleton } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import UploadModal from '../components/documents/UploadModal';
import EditDocumentModal from '../components/documents/EditDocumentModal';
import CategoryBadge from '../components/documents/CategoryBadge';
import ProcessingStatusBadge from '../components/documents/ProcessingStatusBadge';
import { apiFetch, BASE_URL, TOKEN_KEY } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatFileSize, formatDate } from '../utils/formatters';
import useDebounce from '../hooks/useDebounce';
import { clientConfig } from '../config/clientConfig';

const CATEGORIES = [
  'All',
  'Leave Policy', 'Work From Home', 'Insurance', 'Code of Conduct',
  'Appraisal', 'Travel Policy', 'Benefits', 'IT Security', 'Payroll', 'Other',
];

const Documents = () => {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage]             = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reindexingId, setReindexingId] = useState(null);
  const pollTimerRef = useRef(null);

  const debouncedSearch = useDebounce(searchInput);

  // ── Fetch with server-side filtering + pagination ─────────────────────────
  const fetchDocuments = useCallback(async (silent = false, overridePage = null) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: overridePage ?? page, limit: clientConfig.pageSize });
      if (debouncedSearch)  params.set('q', debouncedSearch);
      if (categoryFilter)   params.set('category', categoryFilter);
      if (statusFilter && isAdmin) params.set('status', statusFilter);

      const res = await apiFetch(`/documents?${params}`);
      setDocuments(res.data);
      setPagination(res.pagination ?? null);
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to load documents.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, statusFilter, page, isAdmin]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter, statusFilter]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // ── Poll while any doc is processing ─────────────────────────────────────
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (hasProcessing && !pollTimerRef.current) {
      pollTimerRef.current = setInterval(() => fetchDocuments(true), clientConfig.pollIntervalMs);
    } else if (!hasProcessing && pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    return () => { if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; } };
  }, [documents, fetchDocuments]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUploadSuccess = (newDoc) => { setDocuments((prev) => [newDoc, ...prev]); };
  const handleEditSuccess   = (updated) => { setDocuments((prev) => prev.map((d) => (d._id === updated._id ? updated : d))); };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This removes the file and all indexed chunks.`)) return;
    setDeletingId(doc._id);
    try {
      await apiFetch(`/documents/${doc._id}`, { method: 'DELETE' });
      fetchDocuments();
      toast.success('Document and chunks deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReindex = async (doc) => {
    setReindexingId(doc._id);
    try {
      await apiFetch(`/documents/${doc._id}/reindex`, { method: 'POST' });
      setDocuments((prev) => prev.map((d) => (d._id === doc._id ? { ...d, status: 'processing', processingError: null } : d)));
      toast.success('Re-indexing started.');
    } catch (err) {
      toast.error(err.message || 'Failed to start re-indexing.');
    } finally {
      setReindexingId(null);
    }
  };

  const handleDownload = (doc) => {
    const url = `${BASE_URL}/documents/${doc._id}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } })
      .then((res) => { if (!res.ok) throw new Error('Download failed.'); return res.blob(); })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: blobUrl, download: doc.originalFilename });
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error('Download failed. Please try again.'));
  };

  const totalDocs = pagination?.total ?? documents.length;
  const statusCounts = isAdmin ? {
    processing: documents.filter((d) => d.status === 'processing').length,
    ready:      documents.filter((d) => d.status === 'ready').length,
    failed:     documents.filter((d) => d.status === 'failed').length,
  } : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="mt-1 text-sm text-gray-500">
                {isAdmin ? 'Upload and manage HR policy documents.' : 'Browse HR policy documents.'}
              </p>
              {isAdmin && statusCounts && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <SummaryPill label="Processing" count={statusCounts.processing} color="yellow" />
                  <SummaryPill label="Ready"      count={statusCounts.ready}      color="green"  />
                  <SummaryPill label="Failed"     count={statusCounts.failed}     color="red"    />
                </div>
              )}
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                aria-label="Upload new document"
                className="shrink-0 flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                <MdUpload size={18} aria-hidden="true" />
                Upload Document
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <MdSearch size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                aria-label="Search documents"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search documents…"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <MdFilterList size={18} aria-hidden="true" className="text-gray-400 shrink-0" />
              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {CATEGORIES.map((c) => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
              </select>
            </div>

            {isAdmin && (
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All statuses</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </select>
            )}

            <span className="ml-auto text-sm text-gray-500" aria-live="polite">
              {totalDocs} document{totalDocs !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Skeleton on initial load */}
          {loading && <TableSkeleton rows={6} cols={isAdmin ? 8 : 5} />}

          {/* Empty */}
          {!loading && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400" role="status">
              <MdPictureAsPdf size={48} className="mb-3 opacity-40" aria-hidden="true" />
              <p className="text-sm">
                {debouncedSearch || categoryFilter
                  ? 'No documents match your search.'
                  : isAdmin
                  ? 'No documents yet. Click "Upload Document" to get started.'
                  : 'No documents available.'}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && documents.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Documents table">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Document</Th>
                      <Th>Category</Th>
                      <Th>Uploaded by</Th>
                      <Th>Date</Th>
                      <Th>Size</Th>
                      {isAdmin && <Th>Status</Th>}
                      {isAdmin && <Th>Chunks</Th>}
                      <Th align="right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {documents.map((doc) => (
                      <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <MdPictureAsPdf size={22} aria-hidden="true" className="shrink-0 text-red-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                              {doc.description && <p className="text-xs text-gray-500 truncate max-w-xs">{doc.description}</p>}
                              <p className="text-xs text-gray-400">{doc.originalFilename}</p>
                              {doc.status === 'failed' && doc.processingError && (
                                <p className="mt-0.5 text-xs text-red-500 truncate max-w-xs" title={doc.processingError}>
                                  ⚠ {doc.processingError}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap"><CategoryBadge category={doc.category} /></td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{doc.uploadedBy?.fullName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(doc.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatFileSize(doc.fileSize)}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <ProcessingStatusBadge status={doc.status} animate={doc.status === 'processing'} />
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-center">
                            {doc.status === 'ready'
                              ? (doc.chunkCount || '—')
                              : doc.status === 'processing'
                              ? <span className="animate-pulse text-yellow-500">…</span>
                              : '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {(doc.status === 'ready' || isAdmin) && (
                              <ActionBtn onClick={() => handleDownload(doc)} title="Download PDF" color="text-gray-500 hover:text-cyan-600">
                                <MdDownload size={18} aria-hidden="true" />
                              </ActionBtn>
                            )}
                            {isAdmin && doc.status === 'failed' && (
                              <ActionBtn onClick={() => handleReindex(doc)} title="Retry indexing" color="text-gray-500 hover:text-yellow-600" disabled={reindexingId === doc._id}>
                                <MdRefresh size={18} aria-hidden="true" className={reindexingId === doc._id ? 'animate-spin' : ''} />
                              </ActionBtn>
                            )}
                            {isAdmin && (
                              <ActionBtn onClick={() => setEditingDoc(doc)} title="Edit metadata" color="text-gray-500 hover:text-blue-600">
                                <MdEdit size={18} aria-hidden="true" />
                              </ActionBtn>
                            )}
                            {isAdmin && (
                              <ActionBtn onClick={() => handleDelete(doc)} title="Delete document" color="text-gray-500 hover:text-red-600" disabled={deletingId === doc._id}>
                                {deletingId === doc._id
                                  ? <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                  : <MdDelete size={18} aria-hidden="true" />}
                              </ActionBtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination && pagination.pages > 1 && (
            <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
          )}
        </div>
      </div>

      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />}
      {editingDoc && <EditDocumentModal doc={editingDoc} onClose={() => setEditingDoc(null)} onSuccess={handleEditSuccess} />}
    </div>
  );
};

// ── Presentational helpers ────────────────────────────────────────────────────
const Th = ({ children, align = 'left' }) => (
  <th scope="col" className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-${align}`}>
    {children}
  </th>
);
Th.propTypes = { children: PropTypes.node.isRequired, align: PropTypes.string };

const ActionBtn = ({ children, onClick, title, color, disabled }) => (
  <button type="button" onClick={onClick} title={title} aria-label={title} disabled={disabled}
    className={`rounded p-1.5 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 ${color}`}>
    {children}
  </button>
);
ActionBtn.propTypes = {
  children: PropTypes.node.isRequired, onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,  color: PropTypes.string.isRequired, disabled: PropTypes.bool,
};

const PILL_COLOR = { yellow: 'bg-yellow-50 text-yellow-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700' };
const SummaryPill = ({ label, count, color }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PILL_COLOR[color]}`}>{label}: {count}</span>
);
SummaryPill.propTypes = { label: PropTypes.string.isRequired, count: PropTypes.number.isRequired, color: PropTypes.string.isRequired };

export default Documents;
