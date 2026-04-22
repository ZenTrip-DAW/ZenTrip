import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Download, FolderPlus, ImagePlus, Menu, Trash2, X } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import { uploadImageWithOptions, validateImageFile } from '../../../../../services/cloudinaryService';
import {
  addGalleryPhoto,
  createGalleryFolder,
  deleteGalleryFolder,
  deleteGalleryPhoto,
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

function isSafariBrowser() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPad|iPhone|iPod/.test(navigator.userAgent);
}

async function downloadImage(url, fileName) {
  if (isSafariBrowser()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
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
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);

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
          if (prev === 'Todas') return 'Todas';
          if (prev && folderData.some((f) => f.name === prev)) return prev;
          return 'Todas';
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

  useEffect(() => {
    if (!showFolderMenu) return;
    const handler = () => setShowFolderMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showFolderMenu]);

  const visiblePhotos = useMemo(
    () => selectedFolder === 'Todas' ? photos : photos.filter((p) => (p.folderName || '') === selectedFolder),
    [photos, selectedFolder]
  );

  const previewIndex = previewPhoto ? visiblePhotos.findIndex((p) => p.id === previewPhoto.id) : -1;

  const navigatePreview = (dir) => {
    const next = previewIndex + dir;
    if (next >= 0 && next < visiblePhotos.length) setPreviewPhoto(visiblePhotos[next]);
  };

  useEffect(() => {
    if (!previewPhoto) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') navigatePreview(1);
      if (e.key === 'ArrowLeft') navigatePreview(-1);
      if (e.key === 'Escape') setPreviewPhoto(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewPhoto, previewIndex, visiblePhotos]);

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
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const targetFolder = selectedFolder;
    if (!targetFolder) {
      setMessage('Selecciona una carpeta concreta para subir las fotos.');
      return;
    }

    if (files.length > 10) {
      setMessage('Puedes subir un máximo de 10 fotos a la vez.');
      return;
    }

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation) {
        setMessage(`${file.name}: ${validation}`);
        return;
      }
    }

    setSubmitting(true);
    setMessage(`Subiendo 0/${files.length}...`);

    const newPhotos = [];
    let errors = 0;

    for (const [index, file] of files.entries()) {
      setMessage(`Subiendo ${index + 1}/${files.length}...`);
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
        newPhotos.push({ id: photoId, ...photoPayload });
      } catch {
        errors += 1;
      }
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...newPhotos, ...prev]);
      if (!folders.some((f) => f.name === targetFolder)) {
        setFolders((prev) => [...prev, { id: `temp-${targetFolder}`, name: targetFolder }]);
      }
    }

    if (errors > 0 && newPhotos.length === 0) {
      setMessage('No se pudieron subir las fotos.');
    } else if (errors > 0) {
      setMessage(`${newPhotos.length} foto${newPhotos.length !== 1 ? 's' : ''} subida${newPhotos.length !== 1 ? 's' : ''}, ${errors} con error.`);
    } else {
      setMessage(`${newPhotos.length} foto${newPhotos.length !== 1 ? 's' : ''} subida${newPhotos.length !== 1 ? 's' : ''} correctamente.`);
    }

    setSubmitting(false);
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) => (prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]));
  };

  const allVisibleSelected = visiblePhotos.length > 0 && visiblePhotos.every((p) => selectedPhotos.includes(p.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedPhotos((prev) => prev.filter((id) => !visiblePhotos.some((p) => p.id === id)));
    } else {
      setSelectedPhotos((prev) => [...new Set([...prev, ...visiblePhotos.map((p) => p.id)])]);
    }
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

  const handleDownloadPhoto = async (photo) => {
    const ext = photo?.url?.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${photo.fileName || 'trip-photo'}.${ext}`.replace(/\.+/g, '.');
    await downloadImage(photo.url, fileName);
  };

  const handleDeletePhoto = (photo) => {
    setConfirmModal({
      title: 'Eliminar foto',
      message: `¿Seguro que quieres eliminar "${photo.fileName || 'esta foto'}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteGalleryPhoto(tripId, photo.id, photo.publicId);
          setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
          const remaining = visiblePhotos.filter((p) => p.id !== photo.id);
          if (remaining.length === 0) {
            setPreviewPhoto(null);
          } else {
            const nextIndex = Math.min(previewIndex, remaining.length - 1);
            setPreviewPhoto(remaining[nextIndex]);
          }
        } catch (err) {
          setMessage(err.message || 'No se pudo eliminar la foto.');
        }
      },
    });
  };

  const handleDeleteFolder = () => {
    if (selectedFolder === 'Todas') {
      if (photos.length === 0) {
        setMessage('No hay fotos que eliminar.');
        return;
      }
      setConfirmModal({
        title: 'Eliminar todas las fotos',
        message: `¿Seguro que quieres eliminar las ${photos.length} fotos de este viaje? Las carpetas se mantendrán. Esta acción no se puede deshacer.`,
        variant: 'danger',
        onConfirm: async () => {
          setConfirmModal(null);
          setSubmitting(true);
          try {
            await Promise.all(photos.map((p) => deleteGalleryPhoto(tripId, p.id, p.publicId)));
            setPhotos([]);
            setMessage('Todas las fotos han sido eliminadas.');
          } catch (err) {
            setMessage(err.message || 'No se pudieron eliminar todas las fotos.');
          } finally {
            setSubmitting(false);
          }
        },
      });
      return;
    }

    if (!selectedFolderItem?.id) {
      setMessage('Selecciona una carpeta válida para borrar.');
      return;
    }

    setConfirmModal({
      title: 'Borrar carpeta',
      message: `¿Seguro que quieres borrar la carpeta "${selectedFolderItem.name}"? Se eliminará la carpeta pero no las fotos que contiene.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        setSubmitting(true);
        try {
          await deleteGalleryFolder(tripId, selectedFolderItem.id);
          setFolders((prev) => {
            const next = prev.filter((f) => f.id !== selectedFolderItem.id);
            setSelectedFolder(next[0]?.name || 'Todas');
            return next;
          });
          setMessage('Carpeta borrada correctamente.');
        } catch (err) {
          setMessage(err.message || 'No se pudo borrar la carpeta.');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-4 sm:p-6 flex flex-col gap-5 shadow-sm">
      <div className="rounded-2xl border border-secondary-2 bg-[radial-gradient(120%_120%_at_0%_0%,#FFF4EA_0%,#FFFFFF_55%)] px-4 sm:px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="title-h3-desktop text-secondary-5">Galería del viaje</h2>
            <p className="body-3 text-neutral-4">Sube fotos, organízalas en carpetas y descarga solo las que quieras.</p>
          </div>
          
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-neutral-1/40 border border-neutral-1 rounded-2xl p-3 sm:p-4">

        {/* Mobile: hamburger dropdown */}
        <div className="relative sm:hidden" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowFolderMenu((prev) => !prev)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-neutral-2 bg-white text-neutral-6 text-xs font-semibold hover:bg-neutral-1 transition w-full"
          >
            <Menu className="w-4 h-4 text-neutral-4 shrink-0" />
            <span className="flex-1 truncate text-left">{selectedFolder || 'Carpetas'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-1 text-neutral-4 leading-none shrink-0">
              {visiblePhotos.length}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-4 shrink-0 transition-transform ${showFolderMenu ? 'rotate-180' : ''}`} />
          </button>
          {showFolderMenu && (
            <div className="absolute top-full left-0 mt-1.5 z-20 w-full rounded-2xl border border-neutral-1 bg-white shadow-xl overflow-hidden">
              <div className="py-1.5 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setSelectedFolder('Todas'); setShowFolderMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-left transition ${
                    selectedFolder === 'Todas' ? 'bg-primary-1 text-primary-4' : 'text-neutral-5 hover:bg-neutral-1'
                  }`}
                >
                  Todas
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    selectedFolder === 'Todas' ? 'bg-primary-2 text-primary-5' : 'bg-neutral-1 text-neutral-4'
                  }`}>{photos.length}</span>
                </button>
                {displayFolders.map((folderLabel) => {
                  const isActive = selectedFolder === folderLabel;
                  const count = photos.filter((p) => (p.folderName || '') === folderLabel).length;
                  return (
                    <button
                      key={folderLabel}
                      type="button"
                      onClick={() => { setSelectedFolder(folderLabel); setShowFolderMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-left transition ${
                        isActive ? 'bg-primary-1 text-primary-4' : 'text-neutral-5 hover:bg-neutral-1'
                      }`}
                    >
                      <span className="truncate mr-2">{folderLabel}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                        isActive ? 'bg-primary-2 text-primary-5' : 'bg-neutral-1 text-neutral-4'
                      }`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-neutral-1 p-1.5">
                <button
                  type="button"
                  onClick={() => { setShowFolderMenu(false); setFolderDraft(''); setShowCreateFolderModal(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-secondary-4 hover:bg-secondary-1 transition"
                >
                  <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                  Nueva carpeta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: pills en fila */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedFolder('Todas')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition border ${
              selectedFolder === 'Todas'
                ? 'bg-primary-1 text-primary-4 border-primary-2'
                : 'bg-white text-neutral-5 border-neutral-2 hover:bg-neutral-1'
            }`}
          >
            Todas
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
              selectedFolder === 'Todas' ? 'bg-primary-2 text-primary-5' : 'bg-neutral-1 text-neutral-4'
            }`}>{photos.length}</span>
          </button>
          {displayFolders.map((folderLabel) => {
            const isActive = selectedFolder === folderLabel;
            const count = photos.filter((p) => (p.folderName || '') === folderLabel).length;
            return (
              <button
                key={folderLabel}
                type="button"
                onClick={() => setSelectedFolder(folderLabel)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition border ${
                  isActive
                    ? 'bg-primary-1 text-primary-4 border-primary-2'
                    : 'bg-white text-neutral-5 border-neutral-2 hover:bg-neutral-1'
                }`}
              >
                {folderLabel}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  isActive ? 'bg-primary-2 text-primary-5' : 'bg-neutral-1 text-neutral-4'
                }`}>{count}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => { setFolderDraft(''); setShowCreateFolderModal(true); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-dashed border-secondary-3 text-secondary-4 hover:bg-secondary-1 transition"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Nueva carpeta
          </button>
        </div>

        {/* Botones de acción - siempre visibles */}
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-2">
          <label className="h-9 px-2 sm:px-3 rounded-xl bg-emerald-800 text-white text-xs font-semibold  transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
            <ImagePlus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{submitting ? 'Subiendo...' : 'Subir foto'}</span>
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={submitting} />
          </label>
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={visiblePhotos.length === 0}
            className="h-9 px-2 sm:px-3 rounded-xl border border-neutral-2 text-neutral-5 text-xs font-semibold hover:bg-neutral-1 transition inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <input type="checkbox" checked={allVisibleSelected} readOnly className="w-3.5 h-3.5 pointer-events-none" />
            <span className="hidden sm:inline">{allVisibleSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSelected}
            className="h-9 px-2 sm:px-3 rounded-xl border border-primary-3 text-primary-3 text-xs font-semibold hover:bg-primary-1 transition inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || photos.length === 0}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Descargar seleccionadas</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteFolder}
            className="h-9 px-2 sm:px-3 rounded-xl border border-feedback-error text-feedback-error-strong text-xs font-semibold hover:bg-red-50 transition inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            disabled={submitting || (selectedFolder !== 'Todas' && !selectedFolderItem?.id)}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{selectedFolder === 'Todas' ? 'Vaciar galería' : 'Borrar carpeta'}</span>
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
                  <img
                    src={photo.url}
                    alt={photo.fileName || 'Foto del viaje'}
                    className="w-full h-full object-cover cursor-zoom-in"
                    loading="lazy"
                    onClick={() => setPreviewPhoto(photo)}
                  />
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

               
              </article>
            );
          })}
        </div>
      )}

      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex flex-col p-3 sm:p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="absolute inset-0 bg-neutral-7/80 backdrop-blur-sm" />

          <div className="relative z-10 flex items-center justify-between mb-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-white/50 text-xs">{previewIndex + 1} / {visiblePhotos.length}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPhoto(previewPhoto)}
                className="h-9 px-2 sm:px-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 flex items-center gap-1.5 text-xs font-semibold transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Descargar</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeletePhoto(previewPhoto)}
                className="h-9 px-2 sm:px-3 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 flex items-center gap-1.5 text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex items-center justify-center min-h-0" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.fileName || 'Foto del viaje'}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => navigatePreview(-1)}
              disabled={previewIndex === 0}
              className="absolute left-1 sm:left-2 w-9 h-9 rounded-full bg-neutral-7/60 border border-white/20 text-white hover:bg-neutral-7/80 flex items-center justify-center transition disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigatePreview(1)}
              disabled={previewIndex === visiblePhotos.length - 1}
              className="absolute right-1 sm:right-2 w-9 h-9 rounded-full bg-neutral-7/60 border border-white/20 text-white hover:bg-neutral-7/80 flex items-center justify-center transition disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 text-center mt-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold text-xs sm:text-sm truncate px-4">{previewPhoto.fileName || 'Foto del viaje'}</p>
            <p className="text-white/60 text-xs mt-0.5">Subida por {previewPhoto.uploadedByName || 'Usuario desconocido'} · {formatDate(previewPhoto.createdAt)}</p>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-neutral-1 bg-white shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="title-h3-desktop text-neutral-7">{confirmModal.title}</h3>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-8 h-8 rounded-full border border-neutral-2 text-neutral-5 hover:bg-neutral-1 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="body-3 text-neutral-5 mb-5">{confirmModal.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="h-10 px-4 rounded-xl border border-neutral-2 text-neutral-5 body-3 font-semibold hover:bg-neutral-1 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="h-10 px-4 rounded-xl bg-feedback-error-strong text-white body-3 font-semibold hover:opacity-90 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
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
