# CONFIGURACIÓN GOOGLE SHEETS COMO BASE DE DATOS

## 📋 PASOS PARA CONFIGURAR

### 1. Ejecutar el Script de Configuración

1. Ve a **https://script.google.com/**
2. Click en **"Nuevo proyecto"**
3. Borra el código que aparece por defecto
4. Copia todo el código del archivo `scripts/google-sheets-setup.js`
5. Pega el código en el editor
6. En el menú desplegable (arriba), selecciona `setupDatabase`
7. Click en el botón **"Ejecutar"** (▶️)
8. Autoriza los permisos cuando se solicite
9. Copia el **SHEET_ID** que aparece en el log (lo necesitarás después)

### 2. Obtener el SHEET_ID

El script te dará un ID como este:
```
📋 Sheet ID: 1ABC123xyz...XXXX
⚠️ COPIA ESTE ID PARA LA APP
```

### 3. Configurar en la App

Crea un archivo `.env` en la raíz del proyecto:
```
VITE_GOOGLE_SHEET_ID=tu_sheet_id_aqui
```

O si usas Git, crea `.env.local` y agrégalo al `.gitignore`.

---

## 📊 ESTRUCTURA DE HOJAS CREADAS

| Hoja | Columnas |
|------|----------|
| **Usuarios** | email, password, name, company, industry, website, audience, tone, language, preferredLength, keywords, bannedTopics, styleExamples, createdAt |
| **Settings** | userEmail, key, value, updatedAt |
| **Categorias** | id, name, color, icon, userEmail, createdAt |
| **Recursos** | id, type, url, title, note, tags, aiSummary, status, categoryId, userEmail, createdAt |
| **ContextCards** | id, title, url, notes, userEmail, createdAt |
| **QuickLinks** | id, name, url, icon, userEmail, createdAt |
| **ToDoXL** | id, text, done, userEmail, createdAt |
| **Feedback** | id, promptUsed, output, contentType, rating, adjustmentNote, userEmail, timestamp |
| **Conversiones** | id, name, url, status, bitrate, size, userEmail, createdAt |
| **Newsletter** | id, subject, content, status, userEmail, createdAt, sentAt |

---

## 👤 DATOS DE EJEMPLO INCLUIDOS

El script automáticamente crea:
- 1 usuario demo (demo@rmbrain.app / demo123)
- 4 categorías por defecto
- 4 Quick Links (YouTube, Facebook, TikTok, Instagram)
- 3 recursos de ejemplo
- 2 tareas ToDo

---

## 🔧 MENÚ DE ADMINISTRACIÓN

Después de ejecutar el script, you'll see a new menu **"🔧 Admin RM Brain"** con:
- 📊 Ver estadísticas
- 👥 Ver usuarios  
- 🗑️ Limpiar datos demo
- 📤 Exportar como JSON

---

## ⚠️ NOTAS IMPORTANTES

1. **Seguridad**: Este script usa autenticación básica. Para producción, considera:
   - Usar OAuth2
   - Encriptar passwords
   - Agregar validaciones

2. **Límites**: Google Sheets tiene límites:
   - 10MB por hoja
   - 500,000 celdas máximo
   - Para datos grandes, considera BigQuery

3. **API**: El script incluye funciones `doGet` y `doPost` para crear una Web App si necesitas API más avanzada

4. **Emails**: `MailApp.sendEmail()` tiene límites diarios (100/day personal, 1500/day Google Workspace)

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar script
2. 📋 Copiar SHEET_ID
3. ⚙️ Configurar en app (.env)
4. 🧪 Probar login con demo@rmbrain.app / demo123