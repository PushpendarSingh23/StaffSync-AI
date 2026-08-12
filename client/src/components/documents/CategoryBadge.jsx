import PropTypes from 'prop-types';

// Deterministic colour per category — keeps the palette consistent
const PALETTE = {
  'Leave Policy':     'bg-blue-100 text-blue-700',
  'Work From Home':   'bg-teal-100 text-teal-700',
  'Insurance':        'bg-green-100 text-green-700',
  'Code of Conduct':  'bg-purple-100 text-purple-700',
  'Appraisal':        'bg-orange-100 text-orange-700',
  'Travel Policy':    'bg-yellow-100 text-yellow-700',
  'Benefits':         'bg-pink-100 text-pink-700',
  'IT Security':      'bg-red-100 text-red-700',
  'Payroll':          'bg-indigo-100 text-indigo-700',
  'Other':            'bg-gray-100 text-gray-600',
};

const CategoryBadge = ({ category }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
      PALETTE[category] ?? PALETTE['Other']
    }`}
  >
    {category}
  </span>
);

CategoryBadge.propTypes = {
  category: PropTypes.string.isRequired,
};

export default CategoryBadge;
