# Configurar Firebase

## 1. Crear el proyecto

1. Entra a https://console.firebase.google.com → **Agregar proyecto** (p. ej. `alpez-leather`). Analytics es opcional.
2. **Authentication** → Comenzar → Método de acceso → habilita **Correo electrónico/contraseña**.
3. **Firestore Database** → Crear base de datos → modo **producción** → región `southamerica-east1` (São Paulo) o `us-east1`.
4. **Storage** → Comenzar → misma región. (Storage requiere el plan Blaze; el uso de una tienda pequeña suele quedar dentro de la capa gratuita.)

## 2. Credenciales

**Cliente (panel admin)**: Configuración del proyecto → General → Tus apps → icono `</>` (Web) → registra la app y copia los valores en `.env`:

```
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=alpez-leather.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=alpez-leather
PUBLIC_FIREBASE_STORAGE_BUCKET=alpez-leather.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...
```

Estos valores son públicos por diseño; la seguridad la dan las reglas.

**Servidor (sitio, pedidos, estadísticas)**: Configuración → **Cuentas de servicio** → **Generar nueva clave privada**. Del JSON descargado:

```
FIREBASE_PROJECT_ID=alpez-leather
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@alpez-leather.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=alpez-leather.firebasestorage.app
```

> Nunca subas el JSON ni `.env` al repositorio (ya están en `.gitignore`).

## 3. Publicar las reglas de seguridad

```bash
npm i -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc   # y pon el ID de tu proyecto
npm run deploy:rules
```

## 4. Contenido inicial y primer administrador

```bash
npm run seed                                            # categorías, textos y productos de ejemplo
npm run create-admin -- dueño@correo.com "contraseña-segura"
```

Para agregar otro administrador más adelante, repite `create-admin` con su correo. Para quitarle el acceso, borra su documento en `admins/` desde la consola de Firestore.

## 5. Dominio autorizado

Authentication → Configuración → **Dominios autorizados**: agrega tu dominio de producción (p. ej. `alpezleather.com`) y el de Vercel (`*.vercel.app` del proyecto).

## 6. CORS de Storage (solo si las fotos no cargan en el panel)

Normalmente no hace falta. Si al subir aparece un error de CORS, crea un archivo `cors.json`:

```json
[{ "origin": ["https://alpezleather.com", "http://localhost:4321"], "method": ["GET"], "maxAgeSeconds": 3600 }]
```

y aplícalo con `gsutil cors set cors.json gs://<tu-bucket>`.

## Emuladores (desarrollo sin tocar producción)

Ver el README: `npm run emulators`, variables `*_EMULATOR_HOST` y `PUBLIC_USE_FIREBASE_EMULATORS=true`. La interfaz de los emuladores queda en http://127.0.0.1:4000.
