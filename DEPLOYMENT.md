# Guía de Deployment - StarEduca

## Pre-requisitos

1. **Cuenta Vercel** para hosting
2. **Supabase** (misma instancia que Starbooks)
3. **PayPal Business** para Payouts API
4. **Dominio** stareduca.ai configurado

## 1. Configuración de Supabase

### Ejecutar Migración

```bash
cd starbooks-app
npx supabase db push
# O ejecutar manualmente 011_affiliate_system.sql en SQL Editor
```

### Configurar CORS

En Supabase Dashboard > Settings > API > CORS:
- Agregar `https://stareduca.ai`
- Agregar `http://localhost:3000` (desarrollo)

## 2. Configuración de PayPal

### Crear App en PayPal Developer

1. Ir a https://developer.paypal.com/dashboard/applications
2. Crear nueva app (Sandbox y Live)
3. Obtener Client ID y Secret

### Configurar Webhook

1. En PayPal Dashboard > Webhooks
2. Crear webhook apuntando a: `https://stareduca.ai/api/paypal/webhook`
3. Seleccionar eventos:
   - `PAYMENT.PAYOUTSBATCH.SUCCESS`
   - `PAYMENT.PAYOUTSBATCH.DENIED`
   - `PAYMENT.PAYOUTSITEM.SUCCEEDED`
   - `PAYMENT.PAYOUTSITEM.FAILED`
   - `PAYMENT.PAYOUTSITEM.BLOCKED`
   - `PAYMENT.PAYOUTSITEM.UNCLAIMED`
4. Guardar el Webhook ID

## 3. Deploy en Vercel

### Variables de Entorno en Vercel

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=xxxxx
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=https://stareduca.ai
```

### Conectar Repositorio

```bash
vercel
# o desde el dashboard de Vercel
```

### Configurar Dominio

1. En Vercel > Proyecto > Settings > Domains
2. Agregar `stareduca.ai` y `www.stareduca.ai`
3. Configurar DNS en tu registrador

## 4. Configurar Universal Links (iOS)

### Archivo apple-app-site-association

El archivo ya está en `public/.well-known/apple-app-site-association`.

**Actualizar:**
1. Reemplazar `TEAM_ID` con tu Apple Team ID
2. Verificar `appID` es: `TEAM_ID.com.starbooks.app`

### Verificar

Después del deploy, verificar en:
- https://stareduca.ai/.well-known/apple-app-site-association
- https://branch.io/resources/aasa-validator/

## 5. Configurar App Links (Android)

### Archivo assetlinks.json

El archivo ya está en `public/.well-known/assetlinks.json`.

**Actualizar:**
1. Reemplazar `SHA256_FINGERPRINT_HERE` con el fingerprint de tu app
2. Obtener fingerprint: `keytool -list -v -keystore your-keystore.jks`

### Verificar

- https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://stareduca.ai&relation=delegate_permission/common.handle_all_urls

## 6. Actualizar Starbooks App

### Rebuild con EAS

```bash
cd starbooks-app
eas build --platform all
```

Esto generará nuevos builds con:
- iOS: associatedDomains configurado
- Android: intentFilters configurado

### Subir a App Stores

1. Apple App Store: Subir nuevo build via TestFlight
2. Google Play Store: Subir nuevo AAB

## 7. Checklist Final

- [ ] Migración SQL ejecutada
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio stareduca.ai apuntando a Vercel
- [ ] SSL activo (automático con Vercel)
- [ ] apple-app-site-association accesible
- [ ] assetlinks.json accesible
- [ ] PayPal webhook funcionando
- [ ] CORS configurado en Supabase
- [ ] Starbooks App actualizada en stores

## Flujo de Prueba

1. **Registro de Afiliado:**
   - Usuario con suscripción activa va a stareduca.ai/register
   - Ingresa credenciales de Starbooks
   - Recibe código de estudiante

2. **Compartir Link:**
   - Afiliado copia link: stareduca.ai/starbooks/ref/abc123
   - Comparte en redes sociales

3. **Conversión:**
   - Nuevo usuario hace clic en link
   - Descarga Starbooks desde App Store
   - Se suscribe con código de referido
   - Stripe webhook genera comisión (80%)

4. **Pago:**
   - Afiliado configura PayPal email
   - Solicita pago cuando balance >= $10
   - PayPal Payouts procesa el pago

## Troubleshooting

### Deep links no funcionan

1. Verificar apple-app-site-association es válido JSON
2. Verificar asociatedDomains en app.json
3. Reinstalar app (los entitlements se cachean)

### Comisiones no se generan

1. Verificar stripe-webhook procesa payment_intent.succeeded
2. Verificar referral_code está en metadata
3. Revisar logs en Supabase Edge Functions

### PayPal payouts fallan

1. Verificar cuenta Business activa
2. Verificar balance en cuenta PayPal
3. Revisar logs de webhook
