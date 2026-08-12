import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { BiSearch } from 'react-icons/bi';
import { IoMdAdd } from 'react-icons/io';
import toast from 'react-hot-toast';
import CreateEmployeeModal from '../ModalPopUp/CreateEmployeeModal';
import EditModalDetails from '../ModalPopUp/EditModalDetails';
import Card from './component/Card';
import { CardGridSkeleton } from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import { apiFetch } from '../../utils/api';
import useDebounce from '../../hooks/useDebounce';
import { clientConfig } from '../../config/clientConfig';

const MainSection = ({ setEmployeeId, isAdmin }) => {
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [empById, setEmpById]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState(null);

  // Fire API only after 300 ms of no typing
  const debouncedSearch = useDebounce(searchInput);

  const fetchEmployees = useCallback(async (q, currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: clientConfig.pageSize });
      const path = q
        ? `/employees/search?q=${encodeURIComponent(q)}&${params}`
        : `/employees?${params}`;
      const res = await apiFetch(path);
      setEmployees(res.data);
      setPagination(res.pagination ?? null);
    } catch (err) {
      toast.error(err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchEmployees(debouncedSearch, page);
  }, [fetchEmployees, debouncedSearch, page]);

  // Re-fetch after modal closes
  useEffect(() => {
    if (!showModal && !editModal) {
      fetchEmployees(debouncedSearch, page);
    }
  }, [showModal, editModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = async (id) => {
    try {
      const res = await apiFetch(`/employees/${id}`);
      setEmpById(res.data);
      setEditModal(true);
    } catch (err) {
      toast.error(err.message || 'Could not load employee details.');
    }
  };

  const handleDeleteSuccess = () => {
    toast.success('Employee deleted.');
    fetchEmployees(debouncedSearch, page);
  };

  const totalCount = pagination?.total ?? employees.length;

  return (
    <>
      {showModal && <CreateEmployeeModal setShowModal={setShowModal} />}
      {editModal && empById && (
        <EditModalDetails setEditModal={setEditModal} empById={empById} />
      )}

      <main className="p-6" aria-label="Employee directory">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            People{' '}
            <span className="ml-1 rounded-full bg-cyan-100 px-2 py-0.5 text-sm font-medium text-cyan-700">
              {totalCount}
            </span>
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isAdmin && (
              <div className="relative">
                <BiSearch
                  size={18}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  aria-label="Search employees"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, email, role…"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:w-72"
                />
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 active:bg-cyan-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                <IoMdAdd size={18} aria-hidden="true" />
                Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Skeleton loading */}
        {loading && <CardGridSkeleton count={8} />}

        {/* Empty state */}
        {!loading && employees.length === 0 && (
          <div className="py-20 text-center text-gray-500" role="status">
            {debouncedSearch
              ? `No employees found for "${debouncedSearch}".`
              : isAdmin
              ? 'No employees yet. Click "Add Employee" to get started.'
              : 'No employee record linked to your account yet.'}
          </div>
        )}

        {/* Grid */}
        {!loading && employees.length > 0 && (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="list"
            aria-label="Employee list"
          >
            {employees.map((emp) => (
              <div
                key={emp._id}
                role="listitem"
                tabIndex={0}
                onClick={() => setEmployeeId(emp._id)}
                onKeyDown={(e) => e.key === 'Enter' && setEmployeeId(emp._id)}
                className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 rounded-xl"
              >
                <Card
                  empData={emp}
                  handleEdit={handleEdit}
                  onDeleteSuccess={handleDeleteSuccess}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination && pagination.pages > 1 && (
          <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
        )}
      </main>
    </>
  );
};

MainSection.propTypes = {
  setEmployeeId: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

export default MainSection;
