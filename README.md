# ZenTrip

ZenTrip es una aplicacion web para organizar viajes individuales o en grupo desde una sola plataforma. El proyecto esta dividido en frontend React y backend Node.js, con Firebase como base para autenticacion y datos.

## Estado Actual Del Proyecto

Actualmente ZenTrip ya incluye:

- Autenticacion con Firebase (email/password y Google).
- Verificacion de email, rutas protegidas y flujo de onboarding de perfil.
- Creacion, listado y detalle de viajes.
- Gestion de miembros e invitaciones a viajes (incluyendo enlace publico).
- Exploradores de hoteles, vuelos y coches.
- Busqueda de restaurantes y atracciones.
- Guardado de reservas dentro de viajes.
- Soporte de imagenes de viaje con Cloudinary.
- Notificaciones internas y utilidades de mapa/clima en detalle de viaje.

## Arquitectura

- Frontend: React 19 + Vite + React Router.
- Backend: Node.js + Express 5.
- Datos y auth: Firebase (Firestore + Auth).
- Integraciones externas: RapidAPI (hoteles, vuelos, coches), Google Places, Mailjet, Google Maps, reCAPTCHA.

## Estructura Del Repositorio

```text
ZenTrip/
├── Zentrip-React/   # Frontend
└── Zentrip-Node/    # Backend API
```

## Puesta En Marcha (Local)

1. Instalar dependencias:

```bash
cd Zentrip-Node && npm install
cd ../Zentrip-React && npm install
```

2. Crear variables de entorno:

- Backend: `.env` en `Zentrip-Node/`
- Frontend: `.env` en `Zentrip-React/`

3. Levantar backend:

```bash
cd Zentrip-Node
node server.js
```

4. Levantar frontend:

```bash
cd Zentrip-React
npm run dev
```

5. Abrir aplicacion en:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Documentacion De Cada Modulo

- Frontend: ver `Zentrip-React/README.md`
- Backend: ver `Zentrip-Node/Readme.md`

## Notas

- El frontend consume el backend por `VITE_API_URL` (si no existe, usa `http://localhost:5000/api`).
- Para desplegar en Vercel, configurar todas las variables `VITE_*` del frontend y las variables del backend segun su README.



