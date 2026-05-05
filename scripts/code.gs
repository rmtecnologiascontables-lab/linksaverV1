/**
 * RM BRAIN - GOOGLE APPS SCRIPT
 * =============================
 * Copia este código completo y pégalo en https://script.google.com/
 * Luego despliega como Web App
 */

function doGet(e) {
  const action = e.parameter.action;
  
  // Endpoint para verificar estado
  if (action === 'status') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      app: 'RM Brain API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Google OAuth - Intercambio de tokens
  if (action === 'token') {
    return handleTokenExchange(e.parameter.code);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'RM Brain API running'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  switch(action) {
    case 'googleLogin':
      return handleGoogleLogin(data.code);
      
    case 'registerUser':
      return registerUser(data);
      
    case 'loginUser':
      return loginUser(data.email, data.password);
      
    case 'logoutUser':
      return logoutUser(data.email);
      
    case 'getUserProfile':
      return getUserProfile(data.email);
      
    case 'updateProfile':
      return updateUserProfile(data.email, data.profile);
      
    case 'saveResource':
      return saveResource(data.resource);
      
    case 'getResources':
      return getUserResources(data.email);
      
    case 'saveContextCard':
      return saveContextCard(data.card);
      
    case 'getContextCards':
      return getUserContextCards(data.email);
      
    case 'saveQuickLink':
      return saveQuickLink(data.link);
      
    case 'getQuickLinks':
      return getUserQuickLinks(data.email);
      
    case 'saveToDo':
      return saveToDo(data.todo);
      
    case 'getToDos':
      return getUserToDos(data.email);
      
    case 'saveCategory':
      return saveCategory(data.category);
      
    case 'getCategories':
      return getUserCategories(data.email);
      
    case 'saveFeedback':
      return saveFeedback(data.feedback);
      
    case 'sendWelcome':
      return sendWelcomeEmail(data.email, data.name);
      
case 'sendNewsletter':
      return sendNewsletterEmail(data.email, data.subject, data.content);
      
    case 'saveProject':
      return saveProject(data.project);
      
    case 'getProjects':
      return getUserProjects(data.email);
      
    case 'updateProject':
      return updateProject(data.projectId, data.resourceIds);
      
    default:
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Acción no reconocida: ' + action
      })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== CONFIGURACIÓN ====================
// IMPORTANTE: Configura estas variables en Google Apps Script -> Configuración del proyecto
// const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID';
// const GOOGLE_CLIENT_SECRET = 'TU_CLIENT_SECRET';
// const GOOGLE_REDIRECT_URI = 'https://tu-app.vercel.app/auth/callback';

const GOOGLE_CLIENT_ID = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_SECRET');
const GOOGLE_REDIRECT_URI = PropertiesService.getScriptProperties().getProperty('GOOGLE_REDIRECT_URI');

// Configuración de email
const FROM_EMAIL = 'rmtecnologiascontables@gmail.com';
const FROM_NAME = 'RM Brain - RM Tecnologías Contables';

// ==================== GOOGLE OAUTH ====================

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
    
    const response = UrlFetchApp.fetch(tokenUrl, {
      method: 'POST',
      payload: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const tokens = JSON.parse(response.getContentText());
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
    const response = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    return JSON.parse(response.getContentText());
  } catch (error) {
    return null;
  }
}

function handleGoogleLogin(code) {
  try {
    // Intercambiar código por tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const payload = {
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };
    
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
    
    // Buscar o crear usuario
    const user = findOrCreateGoogleUser(userInfo);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      user: user,
      accessToken: tokens.access_token
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function findOrCreateGoogleUser(googleUser) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Usuarios');
  const data = usersSheet.getDataRange().getValues();
  
  // Buscar usuario existente
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === googleUser.email) {
      // Update Login timestamp
      const row = i + 1;
      usersSheet.getRange(row, 15).setValue(new Date().toISOString());
      
      return {
        email: data[i][0],
        name: data[i][2],
        company: data[i][3],
        industry: data[i][4],
        audience: data[i][6],
        tone: data[i][7],
        language: data[i][8],
        preferredLength: data[i][9],
        keywords: data[i][10],
        bannedTopics: data[i][11],
        styleExamples: data[i][12],
        login: data[i][14],
        logout: data[i][15]
      };
    }
  }
  
  // Crear nuevo usuario con Login/Logout
  usersSheet.appendRow([
    googleUser.email,
    'google_oauth',
    googleUser.name || 'Usuario Google',
    '', '', '', '', 'casual', 'Español', 'medio', '', '', '',
    new Date().toISOString(),  // createdAt
    new Date().toISOString(),   // Login
    ''  // Logout
  ]);
  
  // Enviar email de bienvenida
  sendWelcomeEmail(googleUser.email, googleUser.name);
  
  return {
    email: googleUser.email,
    name: googleUser.name || 'Usuario Google'
  };
}

// ==================== USUARIOS ====================

function registerUser(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Usuarios');
  const dataRange = usersSheet.getDataRange().getValues();
  
  // Verificar si ya existe
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === data.email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'El email ya está registrado'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Crear usuario con Login/Logout
  usersSheet.appendRow([
    data.email,
    data.password,
    data.name || '',
    data.company || '',
    data.industry || '',
    data.website || '',
    data.audience || '',
    data.tone || 'casual',
    data.language || 'Español',
    data.preferredLength || 'medio',
    data.keywords || '',
    data.bannedTopics || '',
    data.styleExamples || '',
    new Date().toISOString(),  // createdAt
    new Date().toISOString(),  // Login (first login time)
    ''  // Logout
  ]);
  
  sendWelcomeEmail(data.email, data.name);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    user: { email: data.email, name: data.name }
  })).setMimeType(ContentService.MimeType.JSON);
}

function loginUser(email, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Usuarios');
  const dataRange = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === email && (dataRange[i][1] === password || dataRange[i][1] === 'google_oauth')) {
      // Update Login timestamp (column 15)
      const row = i + 1;
      usersSheet.getRange(row, 15).setValue(new Date().toISOString());
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        user: {
          email: dataRange[i][0],
          name: dataRange[i][2],
          company: dataRange[i][3],
          industry: dataRange[i][4],
          audience: dataRange[i][6],
          tone: dataRange[i][7],
          language: dataRange[i][8],
          preferredLength: dataRange[i][9],
          keywords: dataRange[i][10],
          bannedTopics: dataRange[i][11],
          styleExamples: dataRange[i][12],
          login: dataRange[i][14],  // Login column (column 15)
          logout: dataRange[i][15]  // Logout column (column 16)
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Email o contraseña incorrectos'
  })).setMimeType(ContentService.MimeType.JSON);
}

function logoutUser(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Usuarios');
  const dataRange = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === email) {
      const row = i + 1;
      usersSheet.getRange(row, 16).setValue(new Date().toISOString());
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Logout registrado correctamente'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Usuario no encontrado'
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUserProfile(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Usuarios');
  const dataRange = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        profile: {
          email: dataRange[i][0],
          name: dataRange[i][2],
          company: dataRange[i][3],
          industry: dataRange[i][4],
          website: dataRange[i][5],
          audience: dataRange[i][6],
          tone: dataRange[i][7],
          language: dataRange[i][8],
          preferredLength: dataRange[i][9],
          keywords: dataRange[i][10],
          bannedTopics: dataRange[i][11],
          styleExamples: dataRange[i][12],
          createdAt: dataRange[i][13],
          login: dataRange[i][14],
          logout: dataRange[i][15]
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Usuario no encontrado'
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateUserProfile(email, profile) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Usuarios');
  const dataRange = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === email) {
      const row = i + 1;
      if (profile.name) usersSheet.getRange(row, 3).setValue(profile.name);
      if (profile.company) usersSheet.getRange(row, 4).setValue(profile.company);
      if (profile.industry) usersSheet.getRange(row, 5).setValue(profile.industry);
      if (profile.website) usersSheet.getRange(row, 6).setValue(profile.website);
      if (profile.audience) usersSheet.getRange(row, 7).setValue(profile.audience);
      if (profile.tone) usersSheet.getRange(row, 8).setValue(profile.tone);
      if (profile.language) usersSheet.getRange(row, 9).setValue(profile.language);
      if (profile.preferredLength) usersSheet.getRange(row, 10).setValue(profile.preferredLength);
      if (profile.keywords) usersSheet.getRange(row, 11).setValue(profile.keywords);
      if (profile.bannedTopics) usersSheet.getRange(row, 12).setValue(profile.bannedTopics);
      if (profile.styleExamples) usersSheet.getRange(row, 13).setValue(profile.styleExamples);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Usuario no encontrado'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== RECURSOS ====================

function saveResource(resource) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Recursos');
  
  const id = resource.id || Math.random().toString(36).substr(2, 9);
  
  sheet.appendRow([
    id,
    resource.type || 'link',
    resource.url || '',
    resource.title,
    resource.note || '',
    (resource.tags || []).join(', '),
    resource.aiSummary || '',
    resource.status || 'processing',
    resource.categoryId || '',
    resource.userEmail,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    id: id
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUserResources(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Recursos');
  const data = sheet.getDataRange().getValues();
  const resources = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][9] === email) {
      resources.push({
        id: data[i][0],
        type: data[i][1],
        url: data[i][2],
        title: data[i][3],
        note: data[i][4],
        tags: data[i][5].split(', ').filter(Boolean),
        aiSummary: data[i][6],
        status: data[i][7],
        categoryId: data[i][8],
        createdAt: data[i][10]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    resources: resources
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== CONTEXT CARDS ====================

function saveContextCard(card) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ContextCards');
  
  const id = Math.random().toString(36).substr(2, 9);
  
  sheet.appendRow([
    id,
    card.title,
    card.url || '',
    card.notes || '',
    card.userEmail,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    id: id
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUserContextCards(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ContextCards');
  const data = sheet.getDataRange().getValues();
  const cards = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === email) {
      cards.push({
        id: data[i][0],
        title: data[i][1],
        url: data[i][2],
        notes: data[i][3],
        createdAt: data[i][5]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    cards: cards
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== QUICK LINKS ====================

function saveQuickLink(link) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QuickLinks');
  
  const id = Math.random().toString(36).substr(2, 9);
  
  sheet.appendRow([
    id,
    link.name,
    link.url,
    link.icon,
    link.userEmail,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    id: id
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUserQuickLinks(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QuickLinks');
  const data = sheet.getDataRange().getValues();
  const links = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === email) {
      links.push({
        id: data[i][0],
        name: data[i][1],
        url: data[i][2],
        icon: data[i][3],
        createdAt: data[i][5]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    links: links
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== TO DO XL ====================

function saveToDo(todo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ToDoXL');
  
  const id = Math.random().toString(36).substr(2, 9);
  
  sheet.appendRow([
    id,
    todo.text,
    todo.done ? 'TRUE' : 'FALSE',
    todo.userEmail,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    id: id
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUserToDos(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ToDoXL');
  const data = sheet.getDataRange().getValues();
  const todos = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === email) {
      todos.push({
        id: data[i][0],
        text: data[i][1],
        done: data[i][2] === 'TRUE',
        createdAt: data[i][4]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    todos: todos
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== CATEGORÍAS ====================

function saveCategory(category) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Categorias');
  
  const id = Math.random().toString(36).substr(2, 9);
  
  sheet.appendRow([
    id,
    category.name,
    category.color,
    category.icon,
    category.userEmail,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    id: id
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUserCategories(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Categorias');
  const data = sheet.getDataRange().getValues();
  const categories = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === email) {
      categories.push({
        id: data[i][0],
        name: data[i][1],
        color: data[i][2],
        icon: data[i][3],
        createdAt: data[i][5]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    categories: categories
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== FEEDBACK ====================

function saveFeedback(feedback) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Feedback');
  
  const id = Math.random().toString(36).substr(2, 9);
  
  sheet.appendRow([
    id,
    feedback.promptUsed,
    feedback.output,
    feedback.contentType,
    feedback.rating,
    feedback.adjustmentNote || '',
    feedback.userEmail,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== PROYECTOS ====================

function saveProject(project) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Proyectos');
  
  const id = project.id || Math.random().toString(36).substr(2, 9);
  
  sheet.appendRow([
    id,
    project.name,
    project.description || '',
    project.resourceIds || '',
    project.createdAt || new Date().toISOString(),
    project.updatedAt || new Date().toISOString(),
    project.userEmail
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    id: id
  })).setMimeType(ContentService.MimeType.JSON);
}

function getUserProjects(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Proyectos');
  const data = sheet.getDataRange().getValues();
  const projects = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === email) {
      projects.push({
        id: data[i][0],
        name: data[i][1],
        description: data[i][2],
        resourceIds: data[i][3] || '',
        createdAt: data[i][4],
        updatedAt: data[i][5],
        userEmail: data[i][6]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    projects: projects
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateProject(projectId, resourceIds) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Proyectos');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectId) {
      const row = i + 1;
      sheet.getRange(row, 4).setValue(resourceIds);
      sheet.getRange(row, 6).setValue(new Date().toISOString());
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Proyecto no encontrado'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== EMAILS ====================

function sendWelcomeEmail(email, name) {
  try {
    const subject = '🎉 Bienvenido a RM Brain - Tu Asistente de Productividad';
    const htmlBody = `
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
            © 2026 <strong>RM TECNOLOGÍAS CONTABLES</strong> - Todos los derechos reservados
          </p>
        </div>
      </body>
      </html>
    `;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: 'RM Brain'
    });
    
    console.log('✅ Email de bienvenida enviado a: ' + email);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      emailSent: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('❌ Error al enviar email de bienvenida: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      emailSent: false,
      emailError: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNewsletterEmail(email, subject, content) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">📧 ${subject}</h2>
      <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
        ${content}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Recibido de <strong>RM Brain</strong> | Tu asistente de productividad<br>
        © 2026 <strong>RM TECNOLOGÍAS CONTABLES</strong>
      </p>
    </div>
  `;
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: 'RM Brain'
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== UTILIDADES ====================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const headers = {
    'Usuarios': ['email', 'password', 'name', 'company', 'industry', 'website', 'audience', 'tone', 'language', 'preferredLength', 'keywords', 'bannedTopics', 'styleExamples', 'createdAt', 'Login', 'Logout'],
    'Settings': ['userEmail', 'key', 'value', 'updatedAt'],
    'Proyectos': ['id', 'name', 'description', 'resourceIds', 'createdAt', 'updatedAt', 'userEmail'],
    'Categorias': ['id', 'name', 'color', 'icon', 'userEmail', 'createdAt'],
    'Recursos': ['id', 'type', 'url', 'title', 'note', 'tags', 'aiSummary', 'status', 'categoryId', 'userEmail', 'createdAt'],
    'ContextCards': ['id', 'title', 'url', 'notes', 'userEmail', 'createdAt'],
    'QuickLinks': ['id', 'name', 'url', 'icon', 'userEmail', 'createdAt'],
    'ToDoXL': ['id', 'text', 'done', 'userEmail', 'createdAt'],
    'Feedback': ['id', 'promptUsed', 'output', 'contentType', 'rating', 'adjustmentNote', 'userEmail', 'timestamp'],
    'Conversiones': ['id', 'name', 'url', 'status', 'bitrate', 'size', 'userEmail', 'createdAt'],
    'Newsletter': ['id', 'subject', 'content', 'status', 'userEmail', 'createdAt', 'sentAt']
  };
  
  // Crear hojas
  Object.keys(headers).forEach(sheetName => {
    try {
      ss.deleteSheet(ss.getSheetByName(sheetName));
    } catch(e) {}
    const sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers[sheetName].length).setValues([headers[sheetName]]);
    sheet.getRange(1, 1, 1, headers[sheetName].length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
  
  // Agregar datos demo
  addSampleData(ss);
  
  return 'Base de datos creada exitosamente';
}

function addSampleData(ss) {
  // Usuario demo
  const usersSheet = ss.getSheetByName('Usuarios');
  usersSheet.appendRow(['demo@rmbrain.app', 'demo123', 'Usuario Demo', 'RM Studio', 'Software / Creator Economy', 'https://rm.studio', 'Developers y creadores digitales 25-40', 'casual', 'Español', 'medio', 'IA, Productividad, Developer Experience', 'crypto pump, política partidista', 'Frases cortas. Una idea por línea.', new Date().toISOString()]);
  
  // Categorías
  const catsSheet = ss.getSheetByName('Categorias');
  [['cat_1', 'IA & Machine Learning', '#8B5CF6', 'robot'], ['cat_2', 'Productividad', '#10B981', 'target'], ['cat_3', 'Desarrollo Web', '#3B82F6', 'code'], ['cat_4', 'Marketing', '#F59E0B', 'megaphone']].forEach(row => catsSheet.appendRow([...row, 'demo@rmbrain.app', new Date().toISOString()]));
  
  // Quick Links
  const qlSheet = ss.getSheetByName('QuickLinks');
  [['ql_1', 'YouTube', 'https://youtube.com', 'youtube'], ['ql_2', 'Facebook', 'https://facebook.com', 'facebook'], ['ql_3', 'TikTok', 'https://tiktok.com', 'tiktok'], ['ql_4', 'Instagram', 'https://instagram.com', 'instagram']].forEach(row => qlSheet.appendRow([...row, 'demo@rmbrain.app', new Date().toISOString()]));
}