import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

const EMAIL_PATTERN = {
  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Must be a valid email.',
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Redirect back to wherever the user tried to go before being sent here
  const from = location.state?.from?.pathname || '/dashboard';

  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values.email, values.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Login failed. Please try again.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mb-8 text-sm text-gray-500">
            Access your StaffSync account.
          </p>

          {serverError && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
              rules={{ required: 'Password is required.' }}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            No account?{' '}
            <Link to="/register" className="font-medium text-cyan-600 hover:underline">
              Create one
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

export default Login;
