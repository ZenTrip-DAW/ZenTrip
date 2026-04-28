import { useRef, useState } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import { uploadImage, uploadFile, validateImageFile, validateFile } from '../../../../../services/cloudinaryService';

const MAX = 3;

function isPdfUrl(url) {
  return url?.toLowerCase().includes('.pdf') || url?.includes('/raw/upload/');
}

export default function BookingReceiptUpload({
  initialUrls = [],
  onUpdate,
  label = 'Capturas de la reserva',
  optional = true,
  allowPdf = false, // forzamos solo imágenes
}) {
  const fileInputRef = useRef(null);
  const [urls, setUrls] = useState(initialUrls);
  const [pending, setPending] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);

  const canAdd = urls.length < MAX && !pending;

  const handleFile = (f) => {
    if (!f) return;
    const err = validateImageFile(f);
    if (err) { setError(err); return; }
    setPending({ file: f, isPdf: false, preview: URL.createObjectURL(f), name: f.name });
    setError(null);
  };

  const handleUpload = async () => {
    if (!pending || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(pending.file);
      const next = [...urls, url];
      setUrls(next);
      setPending(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUpdate?.(next);
    } catch (err) {
      setError(err?.message || 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx) => {
    const next = urls.filter((_, i) => i !== idx);
    setUrls(next);
    onUpdate?.(next);
  };

  const cancelPending = () => {
    setPending(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="body-3 font-semibold text-neutral-5 flex items-center gap-1">
          {label}
          {optional && <span className="font-normal text-neutral-3">(opcional)</span>}
        </p>
        <span className="body-3 text-neutral-3">{urls.length}/{MAX}</span>
      </div>

      {/* Existing files */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-2 bg-neutral-1">
              <img src={url} alt={`Archivo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-neutral-5 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending preview */}
      {pending && (
        <div className="relative rounded-xl overflow-hidden border border-neutral-2 h-36">
          <img src={pending.preview} alt="Vista previa" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-neutral-7/30 flex items-center justify-center">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-secondary-3 text-white body-3 font-semibold rounded-full hover:bg-secondary-4 transition disabled:opacity-60"
            >
              {uploading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Subiendo…
                </span>
              ) : 'Subir archivo'}
            </button>
          </div>
          {!uploading && (
            <button
              type="button"
              onClick={cancelPending}
              className="absolute top-2 right-2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-neutral-5 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`h-20 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer transition-colors
            ${dragging ? 'border-secondary-3 bg-secondary-1/40' : 'border-neutral-2 hover:border-secondary-3 hover:bg-secondary-1/20'}`}
        >
          <Plus className="w-4 h-4 text-neutral-3 pointer-events-none" />
          <span className="body-3 text-neutral-4 pointer-events-none">
            <span className="text-secondary-3 font-medium">Añadir archivo</span>
            <span className="text-neutral-3"> · JPG, PNG, WebP · máx. 8 MB</span>
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && <p className="body-3 text-feedback-error">{error}</p>}
    </div>
  );
}
