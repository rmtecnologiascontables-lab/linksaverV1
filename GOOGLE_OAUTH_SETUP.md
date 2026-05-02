# Google OAuth - Despliegue Final

## Paso 1: Desplegar Google Apps Script como Web App

1. Ve a **https://script.google.com/**
2. Crea un nuevo proyecto o abre el existente
3. Copia el código actualizado del archivo `scripts/google-sheets-setup.js`
4. En el menú, click en **"Desplegar"** → **"Nuevo despliegue"**
5. Selecciona:
   - **Tipo**: Web app
   - **Descripción**: RM Brain API
6. Configura:
   - **Ejecutar como**: Yo
   - **Quién tiene acceso**: Cualquiera
7. Click en **"Desplegar"**
8. **COPIA LA URL** del Web App (algo como `https://script.google.com/macros/s/ABC.../exec`)

---

## Paso 2: Actualizar el Frontend

Edita `src/lib/googleAuth.ts` y reemplaza:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Con tu URL real:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXXXXXXXXXXXX/exec';
```

---

## Paso 3: Probar el Login con Google

1. Recarga la app
2. Click en **"Continuar con Google"**
3. Debería redirigirte a Google para autorizar
4. Después de autorizar, vuelve a la app automáticamente
5. ¡Listo!

---

## 📋 Archivos actualizados:

| Archivo | Descripción |
|---------|--------------|
| `scripts/google-sheets-setup.js` | Actualizado con endpoints OAuth |
| `src/lib/googleAuth.ts` | Cliente OAuth para frontend |

---

## 🔐 Flujo completo:

```
[Botón Google] → [Google OAuth] → [Code] → [Apps Script] → [Token Exchange] → [Usuario]
```

1. Usuario hace click en "Continuar con Google"
2. Redirige a Google para autorización
3. Google retorna un `code` al redirect URI
4. Frontend envía el `code` al Apps Script
5. Apps Script exchange el code por tokens
6. Apps Script busca/crea usuario en Sheets
7. Retorna datos del usuario al frontend
8. Usuario entra a la app

---

## ⚠️ IMPORTANTE: Credenciales de seguridad

Las credenciales en el código son solo para desarrollo. **Nunca** expongas `GOOGLE_CLIENT_SECRET` en el frontend en producción.

El código actual está seguro porque:
- El `client_secret` se usa solo en el Apps Script (backend)
- El frontend solo recibe el `code` temporal
- El Apps Script hace el exchange de tokens

---

## 🚀 ¿Problemas?

| Error | Solución |
|-------|----------|
| "redirect_uri_mismatch" | Verifica que el redirect URI en Google Cloud Console coincida exactamente |
| "access_denied" | El usuario canceló la autorización |
| "invalid_grant" | El código expiró (30 segundos), reintenta |

¿Quieres que agregue más funcionalidades al sistema de login?