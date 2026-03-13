const Input = ({ label, error, variant = 'dark', focusOrange = false, className = '', ...props }) => {
  const focusClass = focusOrange
    ? 'focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30'
    : 'focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/30';

  const inputClass = variant === 'light'
    ? `w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${className}`
    : `mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition ${focusClass} ${className}`;

  const labelClass = variant === 'light'
    ? 'block text-sm font-medium text-slate-600 mb-1'
    : 'text-xs text-white/70';

  return (
    <div>
      {label && <label className={labelClass}>{label}</label>}
      <input className={inputClass} {...props} />
      {error && (
        <p className={`mt-1 text-xs ${variant === 'light' ? 'text-red-600' : 'text-red-400'}`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
