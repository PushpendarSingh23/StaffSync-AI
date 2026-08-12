import { useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { MdClose } from 'react-icons/md';
import { apiFetch } from '../../utils/api';

const CATEGORIES = [
  'Leave Policy', 'Work From Home', 'Insurance', 'Code of Conduct',
  'Appraisal', 'Travel Policy', 'Benefits', 'IT Security', 'Payroll', 'Other',
];

const EditDocumentModal = ({ doc, onClose, onSuccess }) => {
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category);
  const [description, setDescription] = useState(doc.description || '');
  const [status, setStatus] = useState(doc.status);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!category) e.category = 'Category is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const res = await apiFetch(`/documents/${doc._id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: title.trim(), category, description: description.trim(), status }),
      });
      toast.success('Document updated.');
      onSuccess(res.data);
      onClose();
    } catch (err) {
      const msg = err.message || 'Update failed.';
      setErrors({ server: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Document</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">
            {errors.server && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errors.server}</p>
            )}

            <FormField label="Title" error={errors.title}>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                className={inputCls(errors.title)}
              />
            </FormField>

            <FormField label="Category" error={errors.category}>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: undefined })); }}
                className={inputCls(errors.category)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputCls()}
              />
            </FormField>

            <FormField label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls()}
              >
                <option value="ready">Ready</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
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

EditDocumentModal.propTypes = {
  doc: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default EditDocumentModal;
