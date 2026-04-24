# ZenTrip Frontend (React + Vite)

Frontend de ZenTrip para autenticacion, exploracion de opciones de viaje y gestion colaborativa de viajes.

## Stack

- React 19
- React Router 7
- Vite 7
- Firebase Web SDK
- Tailwind CSS 4

## Funcionalidades Actuales

- Registro e inicio de sesion con Firebase (email/password y proveedor Google).
- Flujo de verificacion de email y pagina de acciones de autenticacion.
- Proteccion de rutas para usuarios autenticados y rutas de invitado.
- Perfil de usuario con onboarding inicial.
- Exploradores de vuelos, hoteles y coches.
- Gestion de viajes: crear, listar y ver detalle.
- Gestion de miembros e invitaciones desde los viajes.
- Reserva/guardado de items del viaje y notificaciones internas.
- Soporte de mapas/rutas y widgets de clima en detalle de viaje.
- Subida y eliminacion de imagenes con Cloudinary.

## Estructura Principal

```text
Zentrip-React/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── flights/
│   │   ├── hotels/
│   │   ├── cars/
│   │   ├── trips/
│   │   ├── profile/
│   │   └── shared/
│   ├── config/
│   │   ├── firebaseConfig.js
│   │   └── routes.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── layouts/
│   └── services/
└── vercel.json
```

## Rutas De La Aplicacion

Rutas definidas actualmente en el router:

- `/` (landing)
- `/home`
- `/flights`
- `/hotels`
- `/cars`
- `/auth/login`
- `/auth/register`
- `/auth/verify-email`
- `/auth/action`
- `/profile/edit`
- `/profile/setup`
- `/trips/create`
- `/trips`
- `/trips/:tripId`
- `/legal/privacidad`
- `/legal/terminos`

## Instalacion

```bash
git clone https://github.com/ZenTrip-DAW/ZenTrip.git
cd ZenTrip/Zentrip-React
npm install
```

## Scripts Disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Variables De Entorno

Crea un archivo `.env` en `Zentrip-React/`:

```env
# Backend
VITE_API_URL=http://localhost:5000/api

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Cloudinary (subidas desde cliente)
VITE_CLOUDINARY_CLOUD=tu_cloud_name
VITE_CLOUDINARY_PRESET=tu_upload_preset_unsigned

# Seguridad (captcha)
VITE_RECAPTCHA_SITE_KEY=tu_site_key

# Mapas / rutas / clima en detalle de viaje
VITE_GOOGLE_MAPS_KEY=tu_google_maps_key
```

Notas:
- `VITE_API_URL` tiene fallback a `http://localhost:5000/api` si no se define.
- `VITE_CLOUDINARY_PRESET` debe ser un preset `unsigned` para subida directa desde navegador.
- Si no defines `VITE_RECAPTCHA_SITE_KEY`, el frontend puede desactivar ese flujo en login/registro segun implementacion.

## Integracion Con Backend

- Cliente API central: `src/services/apiClient.js`.
- Incluye token Firebase (`Authorization: Bearer ...`) cuando hay sesion.
- Si recibe `401`, intenta refrescar token una vez y reintenta la peticion.

## Despliegue

- Proyecto preparado para SPA en Vercel con rewrite global a `index.html`.
- Configurado en `vercel.json`.
- Recuerda cargar las variables `VITE_*` en Vercel y hacer redeploy.
