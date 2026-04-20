export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [...new Set([1, totalPages, page, page - 1, page + 1]
    .filter((p) => p >= 1 && p <= totalPages))].sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg border border-neutral-2 text-neutral-5 body-3 disabled:text-neutral-3 disabled:cursor-not-allowed hover:bg-neutral-1 transition"
      >‹</button>

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        return (
          <span key={p} className="flex items-center gap-1.5">
            {prev && p - prev > 1 && <span className="text-neutral-3 body-3">…</span>}
            <button
              onClick={() => onPage(p)}
              className={`w-8 h-8 rounded-lg body-3 font-semibold transition border ${
                p === page
                  ? 'bg-primary-3 border-primary-3 text-white'
                  : 'border-neutral-2 text-neutral-5 hover:bg-neutral-1'
              }`}
            >{p}</button>
          </span>
        );
      })}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg border border-neutral-2 text-neutral-5 body-3 disabled:text-neutral-3 disabled:cursor-not-allowed hover:bg-neutral-1 transition"
      >›</button>
      <span className="body-3 text-neutral-4 ml-1">Página {page} de {totalPages}</span>
    </div>
  );
}
