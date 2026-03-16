const VARIANTS = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export default function AlertMessage({ message, variant = 'error', className = '' }) {
  if (!message) return null;
  return (
    <p className={`body-3 rounded-lg border px-3 py-2 ${VARIANTS[variant]} ${className}`}>
      {message}
    </p>
  );
}
