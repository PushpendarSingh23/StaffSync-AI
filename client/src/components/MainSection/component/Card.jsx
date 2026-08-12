import { useState } from 'react';
import PropTypes from 'prop-types';
import { BsThreeDotsVertical } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { apiFetch } from '../../../utils/api';

const Card = ({ empData, handleEdit, onDeleteSuccess, isAdmin }) => {
  const { _id, firstname, lastname, job, email, image } = empData;
  const [dropDown, setDropDown] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    // Stop click from bubbling to the parent card (which sets the selected ID)
    e.stopPropagation();
    if (!window.confirm(`Delete ${firstname} ${lastname}? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await apiFetch(`/employees/${_id}`, { method: 'DELETE' });
      onDeleteSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to delete employee.');
    } finally {
      setDeleting(false);
      setDropDown(false);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setDropDown(false);
    handleEdit(_id);
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Three-dot menu — admin only */}
      {isAdmin && (
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDropDown(!dropDown); }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Employee actions"
          >
            <BsThreeDotsVertical size={18} />
          </button>

          {dropDown && (
            <ul
              className="absolute right-0 z-10 mt-1 w-28 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              onMouseLeave={() => setDropDown(false)}
            >
              <li>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            </ul>
          )}
        </div>
      )}

      {/* Avatar */}
      <div className="mb-3 flex justify-center">
        <img
          src={image}
          alt={`${firstname} ${lastname}`}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-cyan-100"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstname + ' ' + lastname)}&background=06b6d4&color=fff`;
          }}
        />
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="font-semibold text-gray-900">
          {firstname} {lastname}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 truncate">{email}</p>
        <span className="mt-2 inline-block rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700">
          {job}
        </span>
      </div>
    </div>
  );
};

Card.propTypes = {
  empData: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    firstname: PropTypes.string.isRequired,
    lastname: PropTypes.string.isRequired,
    job: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    image: PropTypes.string,
  }).isRequired,
  handleEdit: PropTypes.func.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

export default Card;
