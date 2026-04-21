import { useEffect, useMemo, useState } from 'react';
import { Download, FolderPlus, ImagePlus, Trash2, X } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import { uploadImageWithOptions, validateImageFile } from '../../../../../services/cloudinaryService';
import {
  addGalleryPhoto,
  createGalleryFolder,
  deleteGalleryFolder,
  getGalleryFolders,
  getGalleryPhotos,
} from '../../../../../services/tripService';

function makeCloudinaryFolderPath(tripId, folderName) {
  const safeTrip = String(tripId || 'trip').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeFolder = String(folderName || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  return `zentrip/trips/${safeTrip}/${safeFolder}`;
}

function formatDate(value) {
  if (!value) return '-';
  const d = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-ES');
}

async function downloadImage(url, fileName) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not download file');
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName || 'photo.jpg';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function GalleryTab({ tripId }) {
  const { user, profile } = useAuth();

  const [folders, setFolders] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [folderDraft, setFolderDraft] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [message, setMessage] = useState('');

  const uploaderName = profile?.displayName || profile?.firstName || user?.email || 'Unknown user';

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [folderData, photoData] = await Promise.all([
          getGalleryFolders(tripId),
          getGalleryPhotos(tripId),
        ]);
        if (cancelled) return;

        setFolders(folderData);
        setSelectedFolder((prev) => {
          if (prev && folderData.some((f) => f.name === prev)) return prev;
          return folderData[0]?.name || '';
        });
        setPhotos(photoData);
      } catch {
        if (!cancelled) setMessage('No se pudieron cargar los datos de la galería. Recarga la página.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  useEffect(() => {
    if (message !== 'Carpeta creada correctamente.') return;

    const timeoutId = setTimeout(() => {
      setMessage('');
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [message]);

  const visiblePhotos = useMemo(
    () => photos.filter((p) => (p.folderName || '') === selectedFolder),
    [photos, selectedFolder]
  );

  const folderNames = useMemo(() => {
    const dynamic = [...new Set(folders.map((f) => f.name).filter(Boolean))];
    return dynamic;
  }, [folders]);

  const selectedCount = selectedPhotos.length;
  const displayFolders = folderNames;
  const selectedFolderItem = folders.find((f) => f.name === selectedFolder);

  const handleCreateFolder = async () => {
    const trimmed = folderDraft.trim();
    if (!trimmed) return;

    setCreatingFolder(true);
    try {
      const folder = await createGalleryFolder(tripId, trimmed, {
        uid: user?.uid,
        name: uploaderName,
        email: user?.email,
      });

      setFolders((prev) => {
        if (prev.some((f) => f.name.toLowerCase() === folder.name.toLowerCase())) return prev;
        return [...prev, folder];
      });
      setSelectedFolder(folder.name);
      setFolderDraft('');
      setShowCreateFolderModal(false);
      setMessage('Carpeta creada correctamente.');
    } catch (err) {
      setMessage(err.message || 'No se pudo crear la carpeta.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validation = validateImageFile(file);
    if (validation) {
      setMessage(validation);
      return;
    }

    setSubmitting(true);
    setMessage('');

    const targetFolder = selectedFolder;
    if (!targetFolder) {
      setMessage('Selecciona una carpeta concreta para subir la foto.');
      setSubmitting(false);
      return;
    }

    try {
      const uploadResult = await uploadImageWithOptions(file, {
        folder: makeCloudinaryFolderPath(tripId, targetFolder),
      });

      const photoPayload = {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        folderName: targetFolder,
        fileName: uploadResult.originalFilename || file.name,
        bytes: uploadResult.bytes || file.size,
        width: uploadResult.width,
        height: uploadResult.height,
        uploadedByUid: user?.uid || '',
        uploadedByName: uploaderName,
      };

      const photoId = await addGalleryPhoto(tripId, photoPayload);
      setPhotos((prev) => [{ id: photoId, ...photoPayload }, ...prev]);
      setMessage('Foto subida correctamente.');

      if (!folders.some((f) => f.name === targetFolder)) {
        setFolders((prev) => [...prev, { id: `temp-${targetFolder}`, name: targetFolder }]);
      }
    } catch (err) {
      setMessage(err.message || 'No se pudo subir la imagen.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) => (prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]));
  };

  const handleDownloadSelected = async () => {
    const selected = photos.filter((p) => selectedPhotos.includes(p.id));
    if (selected.length === 0) {
      setMessage('Selecciona al menos una foto para descargar.');
      return;
    }

    setSubmitting(true);
    setMessage('Preparando descargas...');

    try {
      for (const photo of selected) {
        const ext = photo?.url?.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${photo.fileName || 'trip-photo'}.${ext}`.replace(/\.+/g, '.');
        await downloadImage(photo.url, fileName);
      }
      setMessage('Fotos seleccionadas descargadas.');
    } catch {
      setMessage('No se pudieron descargar algunas fotos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolderItem?.id) {
      setMessage('Selecciona una carpeta válida para borrar.');
      return;
    }

    const ok = window.confirm(`¿Seguro que quieres borrar la carpeta "${selectedFolderItem.name}"?`);
    if (!ok) return;

    setSubmitting(true);
    try {
      await deleteGalleryFolder(tripId, selectedFolderItem.id);
      setFolders((prev) => {
        const next = prev.filter((f) => f.id !== selectedFolderItem.id);
        setSelectedFolder(next[0]?.name || '');
        return next;
      });
      setMessage('Carpeta borrada correctamente.');
    } catch (err) {
      setMessage(err.message || 'No se pudo borrar la carpeta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-4 sm:p-6 flex flex-col gap-5 shadow-sm">
      <div className="rounded-2xl border border-secondary-2 bg-[radial-gradient(120%_120%_at_0%_0%,#FFF4EA_0%,#FFFFFF_55%)] px-4 sm:px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="title-h3-desktop text-secondary-5">Galería del viaje</h2>
            <p className="body-3 text-neutral-4">Sube fotos, organízalas en carpetas y descarga solo las que quieras.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-neutral-2 text-neutral-5">
              {photos.length} foto{photos.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-neutral-2 text-neutral-5">
              {folderNames.length - 1} carpeta{folderNames.length - 1 !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-1 border border-primary-2 text-primary-4">
              {selectedCount} seleccionada{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-end bg-neutral-1/40 border border-neutral-1 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="body-3 font-semibold text-neutral-6">Carpetas existentes</p>
            <p className="text-[11px] text-neutral-4">Activa: {selectedFolder || '-'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayFolders.map((folderLabel, index) => {
              const folderValue = folderNames[index];
              const isActive = selectedFolder === folderValue;
              return (
                <button
                  key={folderValue}
                  type="button"
                  onClick={() => setSelectedFolder(folderValue)}
                  className={`
                    px-3 py-1.5 rounded-full text-[12px] font-semibold transition border
                    ${isActive
                      ? 'bg-primary-1 text-primary-4 border-primary-2'
                      : 'bg-white text-neutral-5 border-neutral-2 hover:bg-neutral-1'}
                  `}
                >
                  {folderLabel}
                </button>
              );
            })}
            {displayFolders.length === 0 && (
              <span className="text-[12px] text-neutral-4">No hay carpetas aún. Crea una para empezar.</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap xl:justify-end">
          <button
            type="button"
            onClick={() => {
              setFolderDraft('');
              setShowCreateFolderModal(true);
            }}
            className="h-10 px-3 rounded-xl border border-secondary-3 text-secondary-4 body-3 font-semibold hover:bg-secondary-1 transition inline-flex items-center gap-1"
          >
            <FolderPlus className="w-4 h-4" /> Crear carpeta
          </button>

          <label className="h-10 px-3 rounded-xl bg-auxiliary-green-4 text-white body-3 font-semibold hover:bg-auxiliary-green-5 transition inline-flex items-center gap-1 cursor-pointer shadow-sm">
            <ImagePlus className="w-4 h-4" /> {submitting ? 'Subiendo...' : 'Subir foto'}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={submitting} />
          </label>

          <button
            type="button"
            onClick={handleDownloadSelected}
            className="h-10 px-3 rounded-xl border border-primary-3 text-primary-3 body-3 font-semibold hover:bg-primary-1 transition inline-flex items-center gap-1"
            disabled={submitting}
          >
            <Download className="w-4 h-4" /> Descargar seleccionadas
          </button>

          <button
            type="button"
            onClick={handleDeleteFolder}
            className="h-10 px-3 rounded-xl border border-feedback-error text-feedback-error-strong body-3 font-semibold hover:bg-red-50 transition inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || !selectedFolderItem?.id}
          >
            <Trash2 className="w-4 h-4" /> Borrar carpeta
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-neutral-1 bg-white px-3 py-2 body-3 text-neutral-5 shadow-sm">{message}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-2 w-8 h-8 border-2 border-neutral-2 border-t-secondary-4 rounded-full animate-spin" />
          <p className="body-3 text-neutral-4">Cargando galería...</p>
        </div>
      ) : !selectedFolder ? (
        <div className="rounded-2xl border border-dashed border-neutral-2 bg-neutral-1/40 py-14 text-center">
          <p className="title-h3-desktop text-neutral-5 mb-1">Selecciona o crea una carpeta</p>
          <p className="body-3 text-neutral-4">Necesitas una carpeta activa para ver y subir fotos.</p>
        </div>
      ) : visiblePhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-2 bg-neutral-1/40 py-14 text-center">
          <p className="title-h3-desktop text-neutral-5 mb-1">Aún no hay fotos en esta carpeta</p>
          <p className="body-3 text-neutral-4">Sube la primera imagen para empezar a llenar la galería.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePhotos.map((photo) => {
            const checked = selectedPhotos.includes(photo.id);
            return (
              <article key={photo.id} className="border border-neutral-1 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                <div className="relative aspect-4/3 bg-neutral-1">
                  <img src={photo.url} alt={photo.fileName || 'Foto del viaje'} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-neutral-7/55 to-transparent pointer-events-none" />
                  <label className="absolute top-2 right-2 bg-white/95 rounded-lg px-2 py-1 text-[11px] font-semibold text-neutral-6 inline-flex items-center gap-1 shadow-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePhotoSelection(photo.id)}
                    />
                    Seleccionar
                  </label>
                </div>

                <div className="p-3.5 flex flex-col gap-1.5">
                  <p className="body-3 font-semibold text-neutral-7 truncate">{photo.fileName || 'Foto del viaje'}</p>
                  <p className="text-[11px] text-neutral-4"><span className="font-semibold text-neutral-5">Carpeta:</span> {photo.folderName || 'Sin carpeta'}</p>
                  <p className="text-[11px] text-neutral-4"><span className="font-semibold text-neutral-5">Subida por:</span> {photo.uploadedByName || 'Usuario desconocido'}</p>
                  <p className="text-[11px] text-neutral-4"><span className="font-semibold text-neutral-5">Fecha:</span> {formatDate(photo.createdAt)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={() => setShowCreateFolderModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-1 bg-white shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="title-h3-desktop text-secondary-5">Crear nueva carpeta</h3>
                <p className="body-3 text-neutral-4 mt-1">Escribe un nombre para organizar tus fotos del viaje.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="w-8 h-8 rounded-full border border-neutral-2 text-neutral-5 hover:bg-neutral-1 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="body-3 text-neutral-5 flex flex-col gap-1.5 mb-4">
              Nombre de carpeta
              <input
                type="text"
                value={folderDraft}
                onChange={(e) => setFolderDraft(e.target.value)}
                placeholder="Ej. Día 1 en Roma"
                className="h-11 rounded-xl border border-neutral-2 bg-white px-3 body-3 text-neutral-6"
                autoFocus
              />
            </label>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="h-10 px-4 rounded-xl border border-neutral-2 text-neutral-5 body-3 font-semibold hover:bg-neutral-1 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={creatingFolder || !folderDraft.trim()}
                className="h-10 px-4 rounded-xl bg-secondary-4 text-white body-3 font-semibold hover:bg-secondary-5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingFolder ? 'Creando...' : 'Crear carpeta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
