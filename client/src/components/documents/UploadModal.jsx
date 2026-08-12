import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { MdUpload, MdClose, MdPictureAsPdf } from 'react-icons/md';
import { BASE_URL, TOKEN_KEY } from '../../utils/api';
import { formatFileSize } from '../../utils/formatters';

const CATEGORIES = [
  'Leave Policy', 'Work From Home', 'Insurance', 'Code of Conduct',
  'Appraisal', 'Travel Policy', 'Benefits', 'IT Security', 'Payroll', 'Other',
];

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const UploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!category) e.category = 'Category is required.';
    if (!file) e.file = 'Please select a PDF file.';
    else if (file.type !== 'application/pdf') e.file = 'Only PDF files are accepted.';
    else if (file.size > MAX_SIZE_BYTES) e.file = 'File must be 20 MB or smaller.';
    return e;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    // Auto-fill title from filename if title is still empty
    if (!title.trim()) {
      setTitle(selected.name.replace(/\.pdf$/i, ''));
    }
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      if (!title.trim()) setTitle(dropped.name.replace(/\.pdf$/i, ''));
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  // ── Submit — uses XMLHttpRequest for real upload progress ─────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('description', description.trim());

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.success('Document uploaded successfully!');
          onSuccess(data.data);
          onClose();
        } else {
          const msg = data?.message || 'Upload failed.';
          setErrors({ server: msg });
          toast.error(msg);
          setProgress(0);
        }
      } catch {
        setErrors({ server: 'Unexpected server response.' });
        setProgress(0);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      const msg = 'Network error. Please try again.';
      setErrors({ server: msg });
      toast.error(msg);
      setProgress(0);
    };

    xhr.open('POST', `${BASE_URL}/documents/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem(TOKEN_KEY)}`);
    // Do NOT set Content-Type — the browser sets multipart/form-data with boundary automatically
    setUploading(true);
    setProgress(0);
    xhr.send(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
            {errors.server && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errors.server}</p>
            )}

            {/* Drop zone */}
            <div
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                errors.file ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-cyan-400 hover:bg-cyan-50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <MdPictureAsPdf size={32} className="text-red-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <MdUpload size={32} className="mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">Drop PDF here or click to browse</p>
                  <p className="mt-1 text-xs text-gray-400">PDF only · Max 20 MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {errors.file && <p className="text-xs text-red-500 -mt-2">{errors.file}</p>}

            {/* Title */}
            <FormField label="Title" error={errors.title}>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                placeholder="e.g. Annual Leave Policy 2024"
                className={inputCls(errors.title)}
              />
            </FormField>

            {/* Category */}
            <FormField label="Category" error={errors.category}>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: undefined })); }}
                className={inputCls(errors.category)}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            {/* Description */}
            <FormField label="Description (optional)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of this document…"
                className={inputCls()}
              />
            </FormField>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
            >
              <MdUpload size={16} />
              {uploading ? `Uploading… ${progress}%` : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputCls = (error) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
    error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
  }`;

const FormField = ({ label, error, children }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

UploadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default UploadModal;
