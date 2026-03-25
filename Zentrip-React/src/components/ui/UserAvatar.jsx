function buildInitialsFromName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ZT';
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return `${first}${second}`.toUpperCase() || 'ZT';
}

export default function UserAvatar({
  src,
  alt = 'Perfil',
  initials,
  fullName,
  sizeClass = 'w-9 h-9',
  containerClass = '',
  backgroundClass = 'bg-slate-100',
  backgroundColor,
  showColorOverlay = false,
  overlayOpacity = 0.35,
  initialsClass = 'body-3 text-slate-600 font-bold',
}) {
  const initialsToShow = initials ?? buildInitialsFromName(fullName);

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${backgroundClass} ${sizeClass} ${containerClass}`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {src ? (
        <>
          <img src={src} alt={alt} className="w-full h-full object-cover" />
          {showColorOverlay && backgroundColor ? (
            <span
              className="absolute inset-0"
              style={{ backgroundColor, opacity: overlayOpacity }}
            />
          ) : null}
        </>
      ) : (
        <span className={initialsClass}>{initialsToShow}</span>
      )}
    </div>
  );
}
