const VARIANTS = {
  primary:   'w-full rounded-xl bg-gradient-to-r from-sky-500 to-orange-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-orange-300/60 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400/60',
  orange:    'w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition duration-200 shadow-md hover:shadow-lg active:scale-[0.98]',
  ghost:     'w-full border border-slate-300 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700 font-medium',
};

const Button = ({ variant = 'primary', children, className = '', ...props }) => (
  <button className={`${VARIANTS[variant]} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
