import { useEffect, useState } from 'react';

export default function ImageLoadGate({ src, alt = '', children }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <>
      {src && (
        <img
          src={src}
          alt={alt}
          aria-hidden="true"
          style={{ display: 'none' }}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
      {loaded || !src ? children : (
        <div className="bg-white rounded-2xl border border-neutral-1 overflow-hidden min-h-65 sm:min-h-75 flex items-center justify-center">
          <div className="flex items-center gap-2.5" aria-label="Cargando" role="status">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-3 w-3 rounded-full"
                style={{
                  background: i === 1 ? '#f97316' : '#94a3b8',
                  animation: 'zt-bounce 1.6s infinite ease-in-out',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes zt-bounce {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
          40%            { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}