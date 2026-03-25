const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

export async function uploadImage(file) {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    throw new Error('Cloudinary config is missing. Check VITE_CLOUDINARY_CLOUD and VITE_CLOUDINARY_PRESET.');
  }

  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', CLOUDINARY_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: 'POST', body: data }
  );

  if (!res.ok) throw new Error('Error uploading image');
  const json = await res.json();
  return json.secure_url;
}
