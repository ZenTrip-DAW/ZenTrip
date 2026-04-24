# ZenTrip Backend (Node.js)

API REST de ZenTrip construida con Express y Firebase Admin. Da soporte a usuarios, invitaciones, viajes y búsquedas de hoteles, vuelos, coches, restaurantes y atracciones.

## Stack

- Node.js
- Express 5
- Firebase Admin SDK
- Axios
- dotenv
- cors
- jsonwebtoken

## Estructura Actual

```text
Zentrip-Node/
├── server.js
├── src/
│   ├── config/
│   │   └── firebase.js
│   ├── controllers/
│   │   ├── attractionControllers.js
│   │   ├── carControllers.js
│   │   ├── flightControllers.js
│   │   ├── hotelcontrollers.js
│   │   ├── invitationControllers.js
│   │   ├── restaurantControllers.js
│   │   ├── tripControllers.js
│   │   └── userControllers.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── recaptchaMiddleware.js
│   ├── routes/
│   │   ├── attractionRouters.js
│   │   ├── authRouters.js
│   │   ├── carRouters.js
│   │   ├── flightRouters.js
│   │   ├── hotelRouters.js
│   │   ├── invitationRouters.js
│   │   ├── restaurantRouters.js
│   │   ├── tripRouters.js
│   │   └── userRouters.js
│   └── services/
│       ├── email/
│       ├── external/
│       └── firebase/
└── test-hotels.html
```

## Instalacion

```bash
git clone https://github.com/ZenTrip-DAW/ZenTrip.git
cd ZenTrip/Zentrip-Node
npm install
```

## Ejecucion

```bash
node server.js
```

Servidor por defecto: `http://localhost:5000`

## Variables De Entorno

Crea un `.env` en `Zentrip-Node/`.

```env
PORT=5000

# CORS
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173

# Firebase Admin
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_CLIENT_EMAIL=tu_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# APIs externas
RAPIDAPI_KEY=tu_rapidapi_key
GOOGLE_PLACES_API_KEY=tu_google_places_api_key

# Invitaciones y correo
JWT_INVITE_SECRET=tu_secreto_para_invitaciones
# Alternativa de compatibilidad si no usas JWT_INVITE_SECRET:
JWT_SECRET=tu_secreto_general
MAILJET_API_KEY=tu_mailjet_api_key
MAILJET_API_SECRET=tu_mailjet_api_secret
MAILJET_SENDER_EMAIL=no-reply@tudominio.com
MAILJET_SENDER_NAME=ZenTrip

# Seguridad login
RECAPTCHA_SECRET_KEY=tu_recaptcha_secret

# Eliminacion de imagenes Cloudinary en viajes
CLOUDINARY_CLOUD=tu_cloud_name
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret
```

Nota: `CORS_ORIGIN` admite varios origenes separados por comas. En local tambien se aceptan `localhost` y `127.0.0.1` para puertos `5173` y `4173`.

## Health Y Utilidades

- `GET /` -> mensaje de servidor activo.
- `GET /test-hotels` y `GET /test-hotels.html` -> pagina de prueba para hoteles.

## API Endpoints

## Auth (`/api/auth`)

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `POST` | `/verify-recaptcha` | No | Valida el token de reCAPTCHA antes del login |

## Usuarios (`/api`)

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/protected-data` | Si | Endpoint protegido de prueba |
| `POST` | `/create-user-admin` | No | Crea usuario con Firebase Admin |
| `GET` | `/search-users` | No | Busca usuarios |
| `GET` | `/users/:uid` | No | Obtiene un usuario por UID |

## Invitaciones (`/api/invitations`)

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `POST` | `/send` | Si | Envia invitaciones de viaje por email |
| `GET` | `/verify` | No | Verifica token de invitacion |
| `POST` | `/accept` | Si | Acepta invitacion |
| `POST` | `/reject` | Si | Rechaza invitacion |
| `POST` | `/claim-my-invitations` | Si | Reclama invitaciones pendientes |
| `GET` | `/public-link/preview` | Si | Previsualiza enlace publico de viaje |
| `POST` | `/public-link` | Si | Crea/recupera enlace publico |
| `POST` | `/public-link/regenerate` | Si | Regenera enlace publico |
| `GET` | `/public-verify` | No | Verifica token publico |
| `POST` | `/public-accept` | Si | Acepta invitacion desde enlace publico |

## Viajes (`/api/trips`)

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/my-trips` | Si | Obtiene viajes del usuario autenticado |
| `GET` | `/:tripId/members` | Si | Lista miembros de un viaje |
| `POST` | `/:tripId/bookings/hotels` | Si | Guarda reserva de hotel en un viaje |
| `DELETE` | `/gallery/image` | Si | Elimina imagen de galeria (Cloudinary) |

## Hoteles (`/api/hotels`)

| Metodo | Ruta |
|---|---|
| `GET` | `/search` |
| `GET` | `/details` |
| `GET` | `/policies` |
| `GET` | `/photos` |
| `GET` | `/children-policies` |
| `GET` | `/rooms` |

## Vuelos (`/api/flights`)

| Metodo | Ruta |
|---|---|
| `GET` | `/destinations` |
| `GET` | `/search` |
| `GET` | `/search-multi-stops` |
| `GET` | `/details` |
| `GET` | `/min-price` |
| `GET` | `/min-price-multi-stops` |
| `GET` | `/seat-map` |

## Coches (`/api/cars`)

| Metodo | Ruta |
|---|---|
| `GET` | `/location` |
| `GET` | `/search` |
| `GET` | `/details` |

## Restaurantes (`/api/restaurants`)

| Metodo | Ruta |
|---|---|
| `GET` | `/search` |
| `GET` | `/details` |

## Atracciones (`/api/attractions`)

| Metodo | Ruta |
|---|---|
| `GET` | `/search` |
| `GET` | `/details` |

## Auth En Rutas Protegidas

Las rutas con `Auth: Si` requieren:

```http
Authorization: Bearer <firebase_id_token>
```

## Notas

- El middleware global de errores centraliza las respuestas ante excepciones.
- El backend depende de claves externas (RapidAPI, Google Places, Mailjet, reCAPTCHA); sin ellas algunos modulos responderan error de configuracion.
