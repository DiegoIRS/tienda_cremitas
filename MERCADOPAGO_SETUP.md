# Mercado Pago — Checkout Pro

La aplicación usa Checkout Pro mediante una Cloud Function de Firebase. La clave privada nunca se expone al navegador: el servidor valida IDs y cantidades contra `functions/catalog.js`, crea la preferencia y recibe el webhook firmado.

## Antes de desplegar

1. En Mercado Pago, crea una aplicación Checkout Pro para Chile y usa primero las credenciales de prueba.
2. En Firebase, verifica que el proyecto tenga Cloud Functions habilitado. Las funciones de 2ª generación y Secret Manager pueden requerir facturación activa.
3. Indica la URL pública del sitio en `functions/.env.vertys-cosmetica`:

```env
CHECKOUT_SITE_URL=https://vertys-cosmetica.web.app
```

4. Guarda las credenciales sin copiarlas al repositorio:

```powershell
firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN
firebase functions:secrets:set MERCADOPAGO_WEBHOOK_SECRET
```

El primer valor es el Access Token de Mercado Pago. El segundo es la clave secreta de Webhooks que Mercado Pago genera en **Tus integraciones > Webhooks**.

## Despliegue y webhook

```powershell
firebase deploy --only functions,hosting
```

En la aplicación de Mercado Pago, registra esta URL HTTPS para el evento **Pagos**:

```text
https://vertys-cosmetica.web.app/api/mercadopago/webhook
```

La función valida `x-signature`, obtiene el pago desde Mercado Pago y actualiza `orders/{orderId}` en Firestore. El estado de una orden solo se considera definitivo después del webhook; el retorno del navegador es informativo.

## Pruebas

- Usa un Access Token de prueba y tarjetas de prueba de Mercado Pago.
- Crea un checkout desde el carrito y confirma que se cree la orden pendiente.
- Usa el simulador de Webhooks de Mercado Pago y verifica que la orden cambie de estado.
- Repite con un pago rechazado y uno pendiente.

No publiques una credencial de producción ni habilites el botón para cobros reales hasta completar estas pruebas.
