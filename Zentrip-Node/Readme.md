# ZenTrip - Backend (Node.js)

API REST del proyecto ZenTrip, construida con **Express** y **Firebase Admin SDK**. Gestiona la autenticación, usuarios, invitaciones a viajes y búsqueda de hoteles a través de la API de Booking.

---

## Tecnologías

- [Node.js](https://nodejs.org/)
- [Express 5](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Axios](https://axios-http.com/)
- [Mailjet](https://www.mailjet.com/) — envío de emails de invitación
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — tokens de invitación
- [dotenv](https://github.com/motdotla/dotenv)
- [CORS](https://github.com/expressjs/cors)

---

## Estructura del proyecto

```
Zentrip-Node/
├── server.js
├── src/
│   ├── config/
│   │   └── firebase.js                      # Inicialización de Firebase Admin SDK
│   ├── controllers/
│   │   ├── hotelcontrollers.js              # Validación HTTP y respuesta para hoteles
│   │   ├── invitationControllers.js         # Lógica de invitaciones a viajes
│   │   └── userControllers.js              # Gestión de usuarios
│   ├── errors/
│   │   ├── AppError.js                      # Clase de error personalizada
│   │   └── index.js
│   ├── middlewares/
│   │   ├── authMiddleware.js                # Verificación de token Firebase (Bearer)
│   │   ├── errorHandler.js                  # Manejador global de errores
│   │   └── recaptchaMiddleware.js           # Verificación de reCAPTCHA
│   ├── routes/
│   │   ├── authRouters.js                   # /api/auth
│   │   ├── hotelRouters.js                  # /api/hotels
│   │   ├── invitationRouters.js             # /api/invitations
│   │   └── userRouters.js                   # /api/users
│   └── services/
│       ├── email/
│       │   ├── invitationTokenService.js    # Generación y verificación de tokens JWT
│       │   └── mailjetService.js            # Envío de emails con Mailjet
│       ├── external/
│       │   ├── apiService.js                # Llamadas genéricas a APIs externas
│       │   └── hotelService.js              # Integración con Booking API (RapidAPI)
│       └── firebase/
│           └── firestoreService.js          # Operaciones con Firestore
├── test-hotels.html                         # Página de prueba para la API de hoteles
├── .env                                     # Variables de entorno (no subir al repo)
└── package.json
```

---

## Instalación

```bash
git clone https://github.com/ZenTrip-DAW/ZenTrip.git
cd ZenTrip/Zentrip-Node
npm install
```

---
## Configuración

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
PORT=5000
RAPIDAPI_KEY=tu_clave_de_rapidapi
MAILJET_API_KEY=tu_clave_mailjet
MAILJET_API_SECRET=tu_secreto_mailjet
JWT_SECRET=tu_secreto_jwt
```

Además coloca el archivo de credenciales de Firebase (`serviceAccountKey.json`) en la ruta configurada en `server.js`.
---

## Ejecución

```bash
node server.js
```

El servidor arranca por defecto en `http://localhost:5000`.

---

## Endpoints

### Auth — `/api/auth`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/verify-recaptcha` | Verifica el token reCAPTCHA antes del login |

---

### Usuarios — `/api/users`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/protected-data` | Datos de prueba protegidos | Bearer token |
| `POST` | `/create-user-admin` | Crea un usuario en Firebase Admin | No |
| `GET` | `/search-users` | Busca usuarios por email/nombre | No |
| `GET` | `/users/:uid` | Obtiene un usuario por UID | No |

---

### Invitaciones — `/api/invitations`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/send` | Envía invitaciones por email a un viaje | Bearer token |
| `GET` | `/verify` | Verifica un token de invitación | No |
| `POST` | `/accept` | Acepta una invitación por email | Bearer token |
| `POST` | `/reject` | Rechaza una invitación por email | Bearer token |
| `POST` | `/claim-my-invitations` | Reclama invitaciones pendientes del usuario | Bearer token |
| `POST` | `/public-link` | Crea o recupera el enlace público de un viaje | Bearer token |
| `GET` | `/public-link/preview` | Previsualiza el enlace público | Bearer token |
| `POST` | `/public-link/regenerate` | Regenera el enlace público | Bearer token |
| `GET` | `/public-verify` | Verifica un token de enlace público | No |
| `POST` | `/public-accept` | Acepta una invitación por enlace público | Bearer token |

---

### Hoteles — `/api/hotels`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/search` | Busca hoteles por ciudad y fechas | No |
| `GET` | `/details` | Obtiene el detalle de un hotel | No |
| `GET` | `/policies` | Obtiene las políticas de un hotel | No |

**Parámetros de `/search`:**

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `city` | string | Sí (o `destId`) | Nombre de la ciudad |
| `destId` | string | Sí (o `city`) | ID de destino de Booking |
| `arrivalDate` | string | Sí | Fecha entrada `YYYY-MM-DD` |
| `departureDate` | string | Sí | Fecha salida `YYYY-MM-DD` |
| `adults` | number | Sí | Número de adultos (≥ 1) |
| `roomQty` | number | No | Número de habitaciones (≥ 1) |
| `pageNumber` | number | No | Página de resultados (5 por página) |
| `languageCode` | string | No | Código de idioma (ej: `es`) |
| `currencyCode` | string | No | Moneda (ej: `EUR`) |

---

## Autenticación

Las rutas protegidas requieren un token de Firebase en la cabecera:

```
Authorization: Bearer <firebase_id_token>
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (por defecto `5000`) |
| `RAPIDAPI_KEY` | Clave de RapidAPI para la Booking API |
| `MAILJET_API_KEY` | Clave pública de Mailjet |
| `MAILJET_API_SECRET` | Clave secreta de Mailjet |
| `JWT_SECRET` | Secreto para firmar tokens de invitación |
