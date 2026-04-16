import { useRef, useState } from 'react';
import { uploadImage, validateImageFile } from '../../../../services/cloudinaryService';

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

export default function CoverUploadModal({ onSave, onClose }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (f) => {
    const validationError = validateImageFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onSave(url);
    } catch (err) {
      console.error('Error uploading trip cover:', err);
      setError(err?.message || 'No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <p className="body-bold text-neutral-6">Imagen del viaje</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
            ${dragging ? 'border-primary-3 bg-primary-1' : 'border-neutral-2 hover:border-primary-3 hover:bg-primary-1'}`}
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-3 pointer-events-none">
              <IconUpload />
              <p className="body-3 text-center">Arrastra una imagen aquí<br />o <span className="text-primary-3 font-medium">selecciona un archivo</span></p>
              <p className="text-xs text-neutral-3">JPG, PNG, WebP · máx. 5 MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview && (
          <button
            type="button"
            onClick={() => { setFile(null); setPreview(null); setError(null); }}
            className="body-3 text-neutral-3 hover:text-neutral-5 text-center -mt-2"
          >
            Cambiar imagen
          </button>
        )}

        {error && <p className="body-3 text-feedback-error text-center -mt-2">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!file || uploading}
            className="flex-1 py-2 rounded-xl bg-primary-3 text-white body-3 font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:opacity-90"
          >
            {uploading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
