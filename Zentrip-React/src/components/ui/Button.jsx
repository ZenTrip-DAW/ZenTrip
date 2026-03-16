const VARIANTS = {
  primary:   'w-full rounded-full bg-gradient-to-r from-sky-500 to-orange-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-orange-300/60 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400/60',
  orange:    'w-full bg-primary-3 hover:bg-orange-400 text-white py-2 rounded-full font-semibold transition duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer',
  ghost:     'w-full border border-slate-300 py-2 rounded-full hover:bg-slate-100 transition text-slate-700 font-medium',
};

const Button = ({ variant = 'primary', children, className = '', ...props }) => (
  <button className={`${VARIANTS[variant]} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
