export default function Footer() {
  return (
    <footer className="px-6 md:px-16 py-6 border-t border-secondary-5 bg-secondary-5 text-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <img src="/img/logo/Logo-white-png.png" alt="ZenTrip" className="h-14 w-auto" />
          <div className="flex flex-col leading-none">
            <p className="font-[Montserrat] text-[16px] font-bold text-white">ZenTrip</p>
            <p className="body-3 mt-1 text-white/90">© 2026 ZenTrip</p>
          </div>
        </div>
        <p className="body-2 text-white">Plan, Pack & Go.</p>
        <p>Esto se tiene que borrar</p>
      </div>
    </footer>
  );
}
