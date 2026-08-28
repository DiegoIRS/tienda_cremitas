# Configuracion Firebase

Proyecto objetivo: `vertys-cosmetica`

## Estado actual

La integracion local ya esta preparada para:

- Login con Google.
- Login/registro con email y contrasena.
- Guardar perfiles basicos en `users/{uid}`.
- Guardar cotizaciones en `quotes/{quoteId}`.
- Usar reglas de Firestore en `firestore.rules`.

## Configurado el 2026-07-13

- Proyecto activo: `vertys-cosmetica`.
- Cuenta usada por `gcloud`: `diegoi.rojas.santander@gmail.com`.
- App Web creada: `Pagina Cremitas Web`.
- App ID: `1:897465091954:web:611ba15f42467cc456ffeb`.
- Firebase config real aplicada en `data/firebase-config.js`.
- Firestore API habilitada.
- Base Firestore `(default)` creada en `southamerica-west1`.
- Firestore modo: `FIRESTORE_NATIVE`.
- Firestore free tier: activo.
- Ruleset publicado en `cloud.firestore`.

## Pendiente

Firebase Authentication aun devuelve `CONFIGURATION_NOT_FOUND` desde Identity Toolkit Admin API.

Para terminar Auth hay dos caminos:

1. Recomendado: abrir Firebase Console > Authentication > Get started y activar:
   - Google.
   - Email/Password.
2. Alternativo por API: llamar `identityPlatform:initializeAuth`, pero el intento actual respondio:
   `BILLING_NOT_ENABLED : Identity Platform feature requires billing to be enabled.`

El navegador interno de Firebase Console sigue usando una cuenta sin permisos, aunque `gcloud` si tiene acceso con `diegoi.rojas.santander@gmail.com`. Para usar la consola visual, cambia la cuenta activa del navegador a esa cuenta o una propietaria del proyecto.

## Colecciones propuestas

- `users`: perfil basico del cliente autenticado.
- `quotes`: cotizaciones generadas desde `carrito.html`.
- `products`: catalogo futuro administrable desde Firestore.

## Cupones de maqueta

- `EXEL10`: 10% de descuento.
- `INSUMOS5`: 5% en productos de linea Insumos.
- `ENVIOGRATIS`: despacho gratis.
