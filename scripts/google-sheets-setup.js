/**
 * SCRIPT DE CONFIGURACIÓN - RM BRAIN DATABASE
 * ===========================================
 * Ejecutar UNA SOLA VEZ en Google Apps Script
 * 
 * Para ejecutar:
 * 1. Ir a https://script.google.com/
 * 2. Nuevo proyecto
 * 3. Copiar todo este código
 * 4. Ejecutar la función setupDatabase()
 * 5. Autorizar permisos
 * 6. Obtener el SHEET_ID de la URL y configurar en la app
 * 
 * Ejemplo URL: https://docs.google.com/spreadsheets/d/1ABC123.../edit
 * El SHEET_ID es: 1ABC123...
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Crear o limpiar hojas existentes
  const sheetsToCreate = [
    'Usuarios',
    'Settings',
    'Categorias', 
    'Recursos',
    'ContextCards',
    'QuickLinks',
    'ToDoXL',
    'Feedback',
    'Conversiones',
    'Newsletter'
  ];
  
  // Eliminar hojas existentes para recrear limpio
  const existingSheets = ss.getSheets();
  existingSheets.forEach(sheet => {
    try {
      ss.deleteSheet(sheet);
    } catch(e) {}
  });
  
  // Crear nuevas hojas con encabezados
  const headers = {
    'Usuarios': ['email', 'password', 'name', 'company', 'industry', 'website', 'audience', 'tone', 'language', 'preferredLength', 'keywords', 'bannedTopics', 'styleExamples', 'createdAt'],
    'Settings': ['userEmail', 'key', 'value', 'updatedAt'],
    'Categorias': ['id', 'name', 'color', 'icon', 'userEmail', 'createdAt'],
    'Recursos': ['id', 'type', 'url', 'title', 'note', 'tags', 'aiSummary', 'status', 'categoryId', 'userEmail', 'createdAt'],
    'ContextCards': ['id', 'title', 'url', 'notes', 'userEmail', 'createdAt'],
    'QuickLinks': ['id', 'name', 'url', 'icon', 'userEmail', 'createdAt'],
    'ToDoXL': ['id', 'text', 'done', 'userEmail', 'createdAt'],
    'Feedback': ['id', 'promptUsed', 'output', 'contentType', 'rating', 'adjustmentNote', 'userEmail', 'timestamp'],
    'Conversiones': ['id', 'name', 'url', 'status', 'bitrate', 'size', 'userEmail', 'createdAt'],
    'Newsletter': ['id', 'subject', 'content', 'status', 'userEmail', 'createdAt', 'sentAt']
  };
  
  sheetsToCreate.forEach(sheetName => {
    const sheet = ss.insertSheet(sheetName);
    const headerRow = headers[sheetName] || [];
    if (headerRow.length > 0) {
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      sheet.getRange(1, 1, 1, headerRow.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });
  
  // Agregar datos de ejemplo para pruebas
  addSampleData(ss);
  
  // Crear menú de administración
  createAdminMenu(ss);
  
  // Mostrar resultado
  const sheetId = ss.getId();
  const sheetUrl = ss.getUrl();
  
  Logger.log('✅ BASE DE DATOS CREADA EXITOSAMENTE');
  Logger.log('📋 Sheet ID: ' + sheetId);
  Logger.log('🔗 URL: ' + sheetUrl);
  Logger.log('⚠️ COPIA ESTE ID PARA LA APP: ' + sheetId);
  
  return { sheetId, sheetUrl };
}

function addSampleData(ss) {
  // Categorías por defecto
  const categoriasSheet = ss.getSheetByName('Categorias');
  const categoriasData = [
    ['cat_1', 'IA & Machine Learning', '#8B5CF6', 'robot', 'demo@rmbrain.app'],
    ['cat_2', 'Productividad', '#10B981', 'target', 'demo@rmbrain.app'],
    ['cat_3', 'Desarrollo Web', '#3B82F6', 'code', 'demo@rmbrain.app'],
    ['cat_4', 'Marketing', '#F59E0B', 'megaphone', 'demo@rmbrain.app'],
  ];
  categoriasData.forEach(row => {
    categoriasSheet.appendRow([...row, new Date().toISOString()]);
  });
  
  // Quick Links por defecto
  const quickLinksSheet = ss.getSheetByName('QuickLinks');
  const quickLinksData = [
    ['ql_1', 'YouTube', 'https://youtube.com', 'youtube', 'demo@rmbrain.app'],
    ['ql_2', 'Facebook', 'https://facebook.com', 'facebook', 'demo@rmbrain.app'],
    ['ql_3', 'TikTok', 'https://tiktok.com', 'tiktok', 'demo@rmbrain.app'],
    ['ql_4', 'Instagram', 'https://instagram.com', 'instagram', 'demo@rmbrain.app'],
  ];
  quickLinksData.forEach(row => {
    quickLinksSheet.appendRow([...row, new Date().toISOString()]);
  });
  
  // Usuario demo
  const usuariosSheet = ss.getSheetByName('Usuarios');
  usuariosSheet.appendRow([
    'demo@rmbrain.app',
    'demo123',
    'Usuario Demo',
    'RM Studio',
    'Software / Creator Economy',
    'https://rm.studio',
    'Developers y creadores digitales 25-40, indie makers y founders early-stage',
    'casual',
    'Español',
    'medio',
    'IA, Productividad, Developer Experience, Indie hacking',
    'crypto pump, política partidista',
    'Frases cortas. Una idea por línea. Emoji ocasional. Cero corporativismo.',
    new Date().toISOString()
  ]);
  
  // Recursos de ejemplo
  const recursosSheet = ss.getSheetByName('Recursos');
  const recursosData = [
    ['res_1', 'link', 'https://platform.openai.com/docs/guides/prompt-engineering', 'Guía de Prompt Engineering - OpenAI', '', 'IA,Prompts,Frontend', 'Mejores prácticas para diseñar prompts efectivos', 'ready', 'cat_1', 'demo@rmbrain.app'],
    ['res_2', 'video', 'https://youtube.com/watch?v=example', 'Cómo construir un Second Brain con IA', '', 'Productividad,IA,Knowledge', 'Sistema PARA aplicado a un knowledge base', 'ready', 'cat_2', 'demo@rmbrain.app'],
    ['res_3', 'note', '', 'Idea: Newsletter semanal sobre DX', 'Formato Hook → Insight → Tool → CTA. 3 secciones max.', 'Newsletter,Frontend,Ideas', 'Estructura modular para newsletter', 'ready', '', 'demo@rmbrain.app'],
  ];
  recursosData.forEach(row => {
    recursosSheet.appendRow([...row, new Date().toISOString()]);
  });
  
  // ToDo de ejemplo
  const todoSheet = ss.getSheetByName('ToDoXL');
  const todoData = [
    ['todo_1', 'Explorar nueva feature de IA', 'FALSE', 'demo@rmbrain.app'],
    ['todo_2', 'Revisar recursos guardados', 'TRUE', 'demo@rmbrain.app'],
  ];
  todoData.forEach(row => {
    todoSheet.appendRow([...row, new Date().toISOString()]);
  });
}

function createAdminMenu(ss) {
  const menu = SpreadsheetApp.getUi().createMenu('🔧 Admin RM Brain');
  menu.addItem('📊 Ver estadísticas', 'showStats');
  menu.addItem('👥 Ver usuarios', 'showUsers');
  menu.addItem('🗑️ Limpiar datos demo', 'cleanDemoData');
  menu.addItem('📤 Exportar como JSON', 'exportJSON');
  menu.addToUi();
}

function showStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stats = `
📊 ESTADÍSTICAS RM BRAIN
=======================
Usuarios: ${ss.getSheetByName('Usuarios').getLastRow() - 1}
Recursos: ${ss.getSheetByName('Recursos').getLastRow() - 1}
Categorías: ${ss.getSheetByName('Categorias').getLastRow() - 1}
QuickLinks: ${ss.getSheetByName('QuickLinks').getLastRow() - 1}
ToDo: ${ss.getSheetByName('ToDoXL').getLastRow() - 1}
  `;
  SpreadsheetApp.getUi().alert(stats);
}

function showUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const users = ss.getSheetByName('Usuarios').getDataRange().getValues();
  let output = '👥 USUARIOS:\n\n';
  users.slice(1).forEach(row => {
    output += `📧 ${row[0]}\n   Nombre: ${row[2]}\n   Empresa: ${row[3]}\n   Registro: ${row[13]}\n\n`;
  });
  SpreadsheetApp.getUi().alert(output);
}

function cleanDemoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('¿Estás seguro?', 'Esto eliminará todos los datos de demo', ui.ButtonSets.YES_NO);
  
  if (response === ui.Button.YES) {
    const demoEmail = 'demo@rmbrain.app';
    const sheets = ['Recursos', 'QuickLinks', 'ToDoXL', 'Categorias'];
    
    sheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      const data = sheet.getDataRange().getValues();
      const rowsToDelete = [];
      
      for (let i = data.length - 1; i >= 1; i--) {
        const row = data[i];
        if (row.some(cell => cell === demoEmail)) {
          rowsToDelete.push(i + 1);
        }
      }
      
      rowsToDelete.forEach(rowNum => {
        sheet.deleteRow(rowNum);
      });
    });
    
    ui.alert('✅ Datos demo eliminados');
  }
}

function exportJSON() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let json = '{\n';
  
  const sheetsToExport = ['Usuarios', 'Categorias', 'Recursos', 'QuickLinks', 'ToDoXL', 'Feedback'];
  
  sheetsToExport.forEach((sheetName, index) => {
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    json += `  "${sheetName}": [\n`;
    rows.forEach((row, rowIndex) => {
      json += '    {';
      json += headers.map((h, i) => `"${h}": "${String(row[i]).replace(/"/g, '\\"')}"`).join(', ');
      json += '}' + (rowIndex < rows.length - 1 ? ',' : '') + '\n';
    });
    json += '  ]' + (index < sheetsToExport.length - 1 ? ',\n' : '\n');
  });
  
  json += '}';
  
  DriveApp.createFile('rm-brain-export.json', json, MimeType.PLAIN_TEXT);
  SpreadsheetApp.getUi().alert('✅ Exportado como JSON a tu Drive');
}

// Función para enviar email de bienvenida
function sendWelcomeEmail(email, name) {
  const subject = '🎉 Bienvenido a RM Brain - Tu Asistente de Productividad';
  const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f9fa; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; }
    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
    .highlight { background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; }
    .features { margin: 20px 0; }
    .feature { padding: 10px; border-left: 3px solid #6366f1; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🧠 RM Brain</div>
    <h2>¡Bienvenido${name ? ' ' + name : ''}!</h2>
    <p>Tu segundo cerebro inteligente está listo para ayudarte.</p>
    
    <div class="features">
      <div class="feature">📚 <strong>Library:</strong> Guarda y organiza tus recursos</div>
      <div class="feature">✍️ <strong>Prompt Studio:</strong> Crea contenido con IA</div>
      <div class="feature">🔧 <strong>Toolkit:</strong> Tus herramientas personalizadas</div>
      <div class="feature">🎵 <strong>Converter:</strong> Convierte audio a texto</div>
      <div class="feature">✅ <strong>To Do XL:</strong> Gestiona tus tareas</div>
    </div>
    
    <p>¡Empieza a explorar!</p>
    <p class="highlight">Tu productividad está a un click de distancia.</p>
    
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #666; font-size: 12px;">
      Este email fue enviado automáticamente por RM Brain.<br>
      Si no te registraste, ignora este mensaje.
    </p>
  </div>
</body>
</html>
  `;
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: body,
    name: 'RM Brain'
  });
}

// Web App para API (opcional - para actualizaciones)
function doGet(e) {
  const action = e.parameter.action;
  
  // Google OAuth Token Exchange
  if (action === 'token') {
    return handleTokenExchange(e.parameter.code);
  }
  
  // Get user info from Google
  if (action === 'userinfo') {
    return getGoogleUserInfo(e.parameter.access_token);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: 'ok', message: 'RM Brain API'}));
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  switch(action) {
    case 'updateUser':
      // Actualizar usuario
      break;
    case 'saveResource':
      // Guardar recurso
      break;
    case 'sendNewsletter':
      sendNewsletter(data.email, data.subject, data.content);
      break;
    case 'googleLogin':
      return handleGoogleLogin(data.code);
    case 'registerGoogleUser':
      return registerGoogleUser(data.email, data.name, data.picture);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success'}));
}

// ==================== GOOGLE OAuth ====================
// IMPORTANT: Add your client credentials in Google Apps Script -> Project Settings -> Script Properties
const GOOGLE_CLIENT_ID = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_SECRET');
const GOOGLE_REDIRECT_URI = PropertiesService.getScriptProperties().getProperty('GOOGLE_REDIRECT_URI');

function handleTokenExchange(code) {
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const payload = {
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };
    
    const options = {
      method: 'POST',
      payload: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = UrlFetchApp.fetch(tokenUrl, options);
    const tokens = JSON.parse(response.getContentText());
    
    // Get user info
    const userInfo = getGoogleUserInfo(tokens.access_token);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      tokens: tokens,
      user: userInfo
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getGoogleUserInfo(accessToken) {
  try {
    const url = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const options = {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };
    
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    return null;
  }
}

function handleGoogleLogin(code) {
  // Exchange code for tokens
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const payload = {
    code: code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code'
  };
  
  try {
    const response = UrlFetchApp.fetch(tokenUrl, {
      method: 'POST',
      payload: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const tokens = JSON.parse(response.getContentText());
    const userInfo = getGoogleUserInfo(tokens.access_token);
    
    if (!userInfo || !userInfo.email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No se pudo obtener información del usuario'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if user exists, if not create
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
    const usersData = usersSheet.getDataRange().getValues();
    
    let userExists = false;
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][0] === userInfo.email) {
        userExists = true;
        break;
      }
    }
    
    if (!userExists) {
      // Create new user with Google data
      usersSheet.appendRow([
        userInfo.email,
        'google_oauth',  // Password - not needed for Google users
        userInfo.name || 'Usuario Google',
        '',  // company
        '',  // industry
        '',  // website
        '',  // audience
        'casual',  // tone
        'Español',  // language
        'medio',  // preferredLength
        '',  // keywords
        '',  // bannedTopics
        '',  // styleExamples
        new Date().toISOString()
      ]);
      
      // Send welcome email
      sendWelcomeEmail(userInfo.email, userInfo.name);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      accessToken: tokens.access_token
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function registerGoogleUser(email, name, picture) {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  const usersData = usersSheet.getDataRange().getValues();
  
  // Check if exists
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][0] === email) {
      return { success: true, message: 'Usuario ya existe' };
    }
  }
  
  usersSheet.appendRow([
    email,
    'google_oauth',
    name || 'Usuario Google',
    '', '', '', '', 'casual', 'Español', 'medio', '', '', '',
    new Date().toISOString()
  ]);
  
  sendWelcomeEmail(email, name);
  return { success: true, message: 'Usuario creado' };
}

function sendNewsletter(email, subject, content) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">📧 ${subject}</h2>
      <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
        ${content}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Recibido de RM Brain | Tu asistente de productividad
      </p>
    </div>
  `;
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: 'RM Brain'
  });
}