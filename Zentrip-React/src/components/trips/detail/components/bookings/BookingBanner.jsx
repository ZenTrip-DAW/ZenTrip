export default function BookingBanner({ src, alt = '', title, subtitle, fallbackColor = 'from-secondary-3 to-secondary-4', objectPosition = 'center' }) {
  const hasText = title || subtitle;
  return (
    <div className="relative h-44 sm:h-52 w-full overflow-hidden rounded-t-2xl">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" style={{ objectPosition }} />
      ) : (
        <div className={`w-full h-full bg-linear-to-br ${fallbackColor}`} />
      )}
      {hasText && (
        <>
          <div className="absolute inset-0 bg-linear-to-t from-neutral-7/70 via-neutral-7/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            {title && <h2 className="title-h3-desktop text-white drop-shadow">{title}</h2>}
            {subtitle && <p className="body-3 text-white/80">{subtitle}</p>}
          </div>
        </>
      )}
    </div>
  );
}
