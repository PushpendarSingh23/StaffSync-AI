import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

const EMAIL_PATTERN = {
  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Must be a valid email.',
};

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser(values.fullName, values.email, values.password, values.role);
      toast.success('Account created! Welcome to StaffSync.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Create account</h1>
          <p className="mb-8 text-sm text-gray-500">
            Set up your StaffSync admin account.
          </p>

          {serverError && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Field
              label="Full name"
              name="fullName"
              type="text"
              register={register}
              error={errors.fullName}
              rules={{ required: 'Full name is required.' }}
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              rules={{ required: 'Email is required.', pattern: EMAIL_PATTERN }}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              register={register}
              error={errors.password}
              rules={{
                required: 'Password is required.',
                validate: (value) => {
                  if (value.length < 8) return 'Must be at least 8 characters.';
                  if (!/[A-Z]/.test(value)) return 'Must contain at least one uppercase letter.';
                  if (!/[0-9]/.test(value)) return 'Must contain at least one number.';
                  return true;
                },
              }}
            />
            <Field
              label="Confirm password"
              name="confirmPassword"
              type="password"
              register={register}
              error={errors.confirmPassword}
              rules={{
                required: 'Please confirm your password.',
                validate: (value) => value === getValues('password') || 'Passwords do not match.',
              }}
            />

            {/* Role selector */}
            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                {...register('role')}
              >
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Only the very first account on StaffSync can self-register as Admin.
                After that, new admins can only be added by an existing admin.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-cyan-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, name, type, register, error, rules }) => (
  <div>
    <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={name}
      type={type}
      autoComplete={name}
      {...register(name, rules)}
      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
        error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
      }`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

Field.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  error: PropTypes.object,
  rules: PropTypes.object,
};

export default Register;
