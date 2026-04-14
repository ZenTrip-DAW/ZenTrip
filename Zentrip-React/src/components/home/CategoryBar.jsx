const CATEGORIES = [
  { key: "vuelos",      label: "Vuelos",           img: new URL("./img/image 34.png",    import.meta.url).href },
  { key: "hoteles",     label: "Hoteles",           img: new URL("./img/hoteles.png",     import.meta.url).href },
  { key: "trenes",      label: "Trenes",            img: new URL("./img/trenes.png",      import.meta.url).href },
  { key: "alquiler",    label: "Alquiler de coche", img: new URL("./img/coches.png",      import.meta.url).href },
  { key: "rutas",       label: "Rutas",             img: new URL("./img/rutas.png",       import.meta.url).href },
  { key: "actividades", label: "Actividades",       img: new URL("./img/actividades.png", import.meta.url).href },
  { key: "restaurante", label: "Restaurante",       img: new URL("./img/restaurante.png", import.meta.url).href },
];

export default function CategoryBar() {
  return (
    <div
      className="w-full rounded-2xl px-3 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 border border-white/50"
      style={{ backgroundColor: "rgba(200, 200, 200, 0.63)" }}
    >
      {/* Mobile: 4 cols → 2 rows | sm: horizontal scroll | md+: flex row filling full width */}
      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-nowrap sm:overflow-x-auto sm:gap-3 md:overflow-x-visible md:gap-6 w-full scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className="w-full sm:flex-none sm:w-20 md:flex-1 md:w-auto cursor-pointer group"
          >
            <div className="w-full min-h-20 md:min-h-24 rounded-xl md:rounded-2xl bg-white/45 border border-white/40 group-hover:scale-110 transition-transform duration-200 flex flex-col items-center justify-center gap-1 px-1 md:px-2 py-2">
              <img src={cat.img} alt={cat.label} className="w-8 h-8 md:w-12 md:h-12 object-contain shrink-0" />
              <span className="text-[10px] md:text-sm font-semibold text-secondary-6 text-center leading-tight line-clamp-2">
                {cat.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
