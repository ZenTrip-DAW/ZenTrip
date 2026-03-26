const SIZE_STYLES = {
  sm: {
    input: 'px-3 py-1.5',
    label: 'body-2-semibold',
    error: 'body-3',
    inputText: 'body-3',
  },
  md: {
    input: 'px-4 py-2',
    label: 'body-bold',
    error: 'body-3',
    inputText: 'body-2',
  },
  lg: {
    input: 'px-5 py-3',
    label: 'body-bold',
    error: 'body-2',
    inputText: 'body',
  },
};

const Input = ({
  label,
  error,
  required,
  variant = 'dark',
  size = 'md',
  className = '',
  labelClass = '',
  inputTextClass = '',
  errorClass = '',
  rightElement = null,
  ...props
}) => {
  const s = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const rightPaddingClass = rightElement ? 'pr-10' : '';

  const inputClass = variant === 'light'
    ? `w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${s.input} ${s.inputText} ${rightPaddingClass} ${inputTextClass} ${className}`
    : `mt-1 w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30 ${s.input} ${s.inputText} ${rightPaddingClass} ${inputTextClass} ${className}`;

  const labelClassName = variant === 'light'
    ? `block text-slate-600 mb-1 ${s.label} ${labelClass}`
    : `block text-white/70 mb-1 ${s.label} ${labelClass}`;

  return (
    <div>
      {label && (
        <label className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input className={inputClass} {...props} />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className={`mt-1 ${s.error} ${errorClass} ${variant === 'light' ? 'text-feedback-error' : 'text-feedback-error-muted'}`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
