#### Probado el registro con correo y contraseña y con Google a través de Firebase 
#### Cuando se ha registrado se redirige a editar perfil, esa información se manda a base de datos de firebase en la coleccion de usuarios que la crea sola FB

## Variables de entorno (frontend)

Para que la subida de imagenes funcione en local y en Vercel, define estas variables:

```env
VITE_CLOUDINARY_CLOUD=tu_cloud_name
VITE_CLOUDINARY_PRESET=tu_upload_preset_unsigned

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Notas:
- `VITE_CLOUDINARY_PRESET` debe ser `unsigned` en Cloudinary para subidas desde navegador.
- En Vercel, las variables deben configurarse en `Project Settings > Environment Variables` y luego redeploy.
