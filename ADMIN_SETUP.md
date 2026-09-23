# Consola administrativa EXEL Chile

La consola está disponible en `/admin.html`. Separa el perfil cliente del acceso operativo y usa roles firmados en Firebase Authentication. Un campo creado desde el navegador nunca concede permisos.

## Activación inicial

1. Despliega las Functions, las reglas y el hosting:

   ```powershell
   firebase deploy --only functions,firestore:rules,hosting
   ```

2. Inicia sesión con la cuenta propietaria en `/admin.html`.
3. Selecciona **Activar acceso de propietario**. Solo las cuentas configuradas en `ADMIN_BOOTSTRAP_EMAILS` pueden completar este paso.
4. En **Equipo y permisos**, añade a las personas que ya hayan iniciado sesión al menos una vez. Elige `Administradora operativa`, `Propietaria` o revoca el acceso.

Para reemplazar la cuenta propietaria inicial, define `ADMIN_BOOTSTRAP_EMAILS` como una lista separada por comas antes del despliegue. No asignes roles creando o modificando documentos de Firestore: los roles se emiten exclusivamente desde las Cloud Functions.

## Operación diaria

- **Pedidos pagados:** muestra pagos aprobados por Mercado Pago, datos de contacto, dirección, productos, estado de preparación y código de seguimiento.
- **Inventario:** los ajustes desde la consola crean un movimiento auditable con stock anterior, variación, stock resultante, usuario y fecha.
- **Catálogo:** permite crear o editar precio, SKU, línea, categoría, descripción, modo de uso, activos, beneficios, INCI y su fuente oficial.
- **Categorías:** se administran desde la misma ficha y quedan disponibles como sugerencias al crear nuevos productos.

Los productos existentes que todavía se sirven desde el catálogo estático pueden editarse desde la consola para crear su documento administrable en Firestore. Para que un producto tenga control de stock, debe existir como documento en la colección `products` y tener un valor de stock.

## Seguridad

- `admin`: puede operar catálogo, categorías, stock y fulfillment.
- `superAdmin`: además puede conceder o revocar roles.
- Los clientes no pueden leer órdenes, movimientos de inventario ni auditoría administrativa.
- El webhook de Mercado Pago sigue siendo la única fuente que confirma el estado del pago.
