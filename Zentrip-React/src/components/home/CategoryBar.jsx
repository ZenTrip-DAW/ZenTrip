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
      className="w-full rounded-2xl px-10 py-5"
      style={{
        backgroundColor: "rgba(180, 180, 180, 0.30)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-stretch gap-6 w-full">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className="flex-1 cursor-pointer group"
          >
            <div className="w-full h-28 rounded-xl bg-white/60 border   group-hover:bg-primary-1 transition-all duration-200 flex flex-col items-center justify-center gap-2 px-2 py-3">
              <img src={cat.img} alt={cat.label} className="w-16 h-16 object-contain shrink-0" />
              <span className="body-2-semibold text-secondary-6  transition-colors duration-200 text-center leading-tight">
                {cat.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
