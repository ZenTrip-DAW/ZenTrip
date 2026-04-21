const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;
const MAX_UPLOAD_MB = 5;
const UPLOAD_TIMEOUT_MS = 30000;

export function validateImageFile(file) {
  if (!file) return 'No se ha seleccionado ningún archivo.';

  if (!file.type?.startsWith('image/')) {
    return 'El archivo debe ser una imagen (JPG, PNG, WebP...).';
  }

  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `La imagen no puede superar ${MAX_UPLOAD_MB} MB.`;
  }

  return null;
}

export async function uploadImage(file) {
  const result = await uploadImageWithOptions(file);
  return result.secureUrl;
}

export async function uploadImageWithOptions(file, { folder } = {}) {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    throw new Error('Cloudinary config is missing. Check VITE_CLOUDINARY_CLOUD and VITE_CLOUDINARY_PRESET.');
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', CLOUDINARY_PRESET);
  if (folder) data.append('folder', folder);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      { method: 'POST', body: data, signal: controller.signal }
    );
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('La subida tardó demasiado. Revisa tu conexión e inténtalo de nuevo.');
    }

    throw new Error('No se pudo conectar con el servicio de imágenes. Inténtalo de nuevo.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let cloudinaryMessage = '';
    try {
      const errorBody = await res.json();
      cloudinaryMessage = errorBody?.error?.message || '';
    } catch {
      // No-op: if body is not JSON, keep generic message.
    }

    throw new Error(cloudinaryMessage || 'Error al subir la imagen.');
  }

  const json = await res.json();

  if (!json?.secure_url) {
    throw new Error('La respuesta del servicio de imágenes no es válida.');
  }

  return {
    secureUrl: json.secure_url,
    publicId: json.public_id || '',
    originalFilename: json.original_filename || file?.name || '',
    bytes: json.bytes || file?.size || 0,
    width: json.width || null,
    height: json.height || null,
    format: json.format || '',
  };
}
