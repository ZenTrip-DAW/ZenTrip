export default function PlaceholderTab({ label, emoji = '🚧' }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-12 flex flex-col items-center justify-center gap-3 text-center">
      <span className="text-4xl">{emoji}</span>
      <h3 className="title-h3-desktop text-secondary-5">{label}</h3>
      <p className="body-3 text-neutral-3">Esta sección estará disponible próximamente</p>
    </div>
  );
}
