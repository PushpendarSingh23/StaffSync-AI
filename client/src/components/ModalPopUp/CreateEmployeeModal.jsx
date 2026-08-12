import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

/**
 * Add Employee modal.
 *
 * Bugs fixed (carried over from the original Formik version):
 * 1. fetch POST was missing body — now sends JSON.stringify(values).
 * 2. dateOfJoining was misnamed "dateofjoining" in some places.
 */

const EMAIL_PATTERN = {
  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Must be a valid email.',
};

const CreateEmployeeModal = ({ setShowModal }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      job: '',
      dateOfJoining: '',
      image: '',
    },
  });

  const onSubmit = async (values) => {
    clearErrors('root.serverError');
    try {
      await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Employee added successfully!');
      setShowModal(false);
    } catch (err) {
      const msg = err.message || 'Failed to create employee.';
      setError('root.serverError', { message: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">New Employee</h2>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {/* Server-level error */}
            {errors.root?.serverError && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.root.serverError.message}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="First Name"
                name="firstname"
                register={register}
                error={errors.firstname}
                rules={{ required: 'First name is required.' }}
              />
              <Field
                label="Last Name"
                name="lastname"
                register={register}
                error={errors.lastname}
                rules={{ required: 'Last name is required.' }}
              />
              <Field
                label="Email Address"
                name="email"
                type="email"
                register={register}
                error={errors.email}
                rules={{ required: 'Email is required.', pattern: EMAIL_PATTERN }}
                className="sm:col-span-2"
              />
              <Field
                label="Phone"
                name="phone"
                register={register}
                error={errors.phone}
                rules={{ required: 'Phone is required.' }}
              />
              <Field
                label="Job Title"
                name="job"
                register={register}
                error={errors.job}
                rules={{ required: 'Job title is required.' }}
              />
              <Field
                label="Date of Joining"
                name="dateOfJoining"
                type="date"
                register={register}
                error={errors.dateOfJoining}
                rules={{ required: 'Date of joining is required.' }}
              />
              <Field
                label="Image URL"
                name="image"
                register={register}
                error={errors.image}
                rules={{ required: 'Image URL is required.' }}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** Reusable form field with label and inline error */
const Field = ({ label, name, type = 'text', register, error, rules, className = '' }) => (
  <div className={className}>
    <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={name}
      type={type}
      {...register(name, rules)}
      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
        error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
      }`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

CreateEmployeeModal.propTypes = {
  setShowModal: PropTypes.func.isRequired,
};

Field.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  register: PropTypes.func.isRequired,
  error: PropTypes.object,
  rules: PropTypes.object,
  className: PropTypes.string,
};

export default CreateEmployeeModal;
