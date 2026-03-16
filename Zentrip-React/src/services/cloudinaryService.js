const CLOUDINARY_CLOUD = 'dgph0sewo';
const CLOUDINARY_PRESET = 'zentrip_avatars';

export async function uploadImage(file) {
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
