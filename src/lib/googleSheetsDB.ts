const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '';

const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;

interface UserData {
  email: string;
  name: string;
  password?: string;
  company?: string;
  industry?: string;
  website?: string;
  audience?: string;
  tone?: string;
  language?: string;
  preferredLength?: string;
  keywords?: string;
  bannedTopics?: string;
  styleExamples?: string;
  createdAt?: string;
  login?: string;
  logout?: string;
}

interface ResourceData {
  id?: string;
  type: 'link' | 'video' | 'audio' | 'note';
  url?: string;
  title: string;
  note?: string;
  tags: string[];
  aiSummary?: string;
  status: 'processing' | 'ready';
  categoryId?: string;
  userEmail: string;
  createdAt: string;
}

interface ContextCardData {
  id?: string;
  title: string;
  url?: string;
  notes?: string;
  userEmail: string;
}

interface QuickLinkData {
  id?: string;
  name: string;
  url: string;
  icon: string;
  userEmail: string;
}

interface ToDoItemData {
  id?: string;
  text: string;
  done: boolean;
  userEmail: string;
  createdAt: string;
}

interface FeedbackData {
  id?: string;
  promptUsed: string;
  output: string;
  contentType: string;
  rating: 'up' | 'down';
  adjustmentNote?: string;
  userEmail: string;
  timestamp: string;
}

interface ProjectData {
  id?: string;
  name: string;
  description?: string;
  resourceIds?: string;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
}

async function querySheet(sheetName: string, query?: string): Promise<any[]> {
  if (!SHEET_ID) return [];
  const url = `${API_URL}?sheet=${encodeURIComponent(sheetName)}${query ? `&tq=${encodeURIComponent(query)}` : ''}`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text.substring(47, text.length - 2));
    return json.table.rows.map((row: any) => row.c.map((cell: any) => cell?.v ?? ''));
  } catch (error) {
    console.error(`Error querying ${sheetName}:`, error);
    return [];
  }
}

async function appendRow(sheetName: string, values: any[]): Promise<boolean> {
  if (!SHEET_ID) return false;
  const url = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&tq=INSERT%20INTO%20${encodeURIComponent(sheetName)}%20VALUES%20(${values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(', ')})`;
  try {
    await fetch(url);
    return true;
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error);
    return false;
  }
}

// User operations
export async function registerUser(userData: UserData): Promise<boolean> {
  const users = await querySheet('Usuarios', `SELECT * WHERE A = '${userData.email}'`);
  if (users.length > 0) return false;
  
  return appendRow('Usuarios', [
    userData.email,
    userData.name || '',
    userData.password || '',
    userData.company || '',
    userData.industry || '',
    userData.website || '',
    userData.audience || '',
    userData.tone || 'casual',
    userData.language || 'Español',
    userData.preferredLength || 'medio',
    userData.keywords || '',
    userData.bannedTopics || '',
    userData.styleExamples || '',
    new Date().toISOString(),
  ]);
}

export async function loginUser(email: string, password: string): Promise<UserData | null> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'loginUser',
        email: email,
        password: password
      }),
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem('rm-brain-user-email', email);
        return data.user;
      }
    }
    return null;
  } catch (error) {
    console.error('Login via Apps Script failed, falling back to Sheets:', error);
    // Fallback to direct Sheets query
    const users = await querySheet('Usuarios', `SELECT * WHERE A = '${email}' AND C = '${password}'`);
    if (users.length === 0) return null;
    
    const row = users[0];
    return {
      email: row[0],
      name: row[1],
      password: row[2],
      company: row[3],
      industry: row[4],
      website: row[5],
      audience: row[6],
      tone: row[7],
      language: row[8],
      preferredLength: row[9],
      keywords: row[10],
      bannedTopics: row[11],
      styleExamples: row[12],
      createdAt: row[13],
    };
  }
}

export async function getUserProfile(email: string): Promise<UserData | null> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'getUserProfile',
        email: email
      }),
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.profile) {
        return data.profile;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function updateUserProfile(email: string, profile: Partial<UserData>): Promise<boolean> {
  // Note: Full update would require reading all rows, finding the user, and updating
  // For now, this is a placeholder - in production you'd use Apps Script Web App for updates
  console.log('Update profile for:', email, profile);
  return true;
}

// Resources operations
export async function saveResource(resource: ResourceData): Promise<boolean> {
  if (!APPS_SCRIPT_URL) {
    console.warn('Apps Script URL no configurada');
    return false;
  }
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveResource',
        resource: {
          id: resource.id || Math.random().toString(36).substr(2, 9),
          type: resource.type,
          url: resource.url || '',
          title: resource.title,
          note: resource.note || '',
          tags: resource.tags,
          aiSummary: resource.aiSummary || '',
          status: resource.status || 'ready',
          categoryId: resource.categoryId || '',
          userEmail: resource.userEmail,
          createdAt: new Date().toISOString(),
        }
      }),
    });
    
    const text = await response.text();
    const data = JSON.parse(text);
    
    if (data.success) {
      console.log('✅ Recurso guardado en Sheets');
      return true;
    }
    
    console.error('Error guardando recurso:', data.error);
    return false;
  } catch (error) {
    console.error('Error guardando recurso:', error);
    return false;
  }
}

export async function getUserResources(email: string): Promise<ResourceData[]> {
  if (!APPS_SCRIPT_URL) {
    console.warn('Apps Script URL no configurada');
    return [];
  }
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'getResources',
        email: email,
      }),
    });
    
    const text = await response.text();
    const data = JSON.parse(text);
    
    if (data.success && data.resources) {
      return data.resources.map((r: any) => ({
        id: r.id,
        type: r.type,
        url: r.url,
        title: r.title,
        note: r.note,
        tags: r.tags || [],
        aiSummary: r.aiSummary,
        status: r.status,
        categoryId: r.categoryId,
        userEmail: r.userEmail,
        createdAt: r.createdAt,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error obteniendo recursos:', error);
    return [];
  }
}

// Legacy function - kept for backward compatibility
async function _getUserResourcesLegacy(email: string): Promise<ResourceData[]> {
  const resources = await querySheet('Recursos', `SELECT * WHERE J = '${email}'`);
  return resources.map((row) => ({
    id: row[0],
    type: row[1],
    url: row[2],
    title: row[3],
    note: row[4],
    tags: row[5].split(', ').filter(Boolean),
    aiSummary: row[6],
    status: row[7],
    categoryId: row[8],
    userEmail: row[9],
    createdAt: row[10],
  }));
}

// Context Cards operations
export async function saveContextCard(card: ContextCardData): Promise<boolean> {
  return appendRow('ContextCards', [
    Math.random().toString(36).substr(2, 9),
    card.title,
    card.url || '',
    card.notes || '',
    card.userEmail,
  ]);
}

export async function getUserContextCards(email: string): Promise<ContextCardData[]> {
  const cards = await querySheet('ContextCards', `SELECT * WHERE D = '${email}'`);
  return cards.map((row) => ({
    id: row[0],
    title: row[1],
    url: row[2],
    notes: row[3],
    userEmail: row[4],
  }));
}

// Quick Links operations
export async function saveQuickLink(link: QuickLinkData): Promise<boolean> {
  return appendRow('QuickLinks', [
    Math.random().toString(36).substr(2, 9),
    link.name,
    link.url,
    link.icon,
    link.userEmail,
  ]);
}

export async function getUserQuickLinks(email: string): Promise<QuickLinkData[]> {
  const links = await querySheet('QuickLinks', `SELECT * WHERE D = '${email}'`);
  return links.map((row) => ({
    id: row[0],
    name: row[1],
    url: row[2],
    icon: row[3],
    userEmail: row[4],
  }));
}

// ToDo operations
export async function saveToDo(todo: ToDoItemData): Promise<boolean> {
  return appendRow('ToDoXL', [
    Math.random().toString(36).substr(2, 9),
    todo.text,
    todo.done ? 'TRUE' : 'FALSE',
    todo.userEmail,
    new Date().toISOString(),
  ]);
}

export async function getUserToDos(email: string): Promise<ToDoItemData[]> {
  const todos = await querySheet('ToDoXL', `SELECT * WHERE C = '${email}'`);
  return todos.map((row) => ({
    id: row[0],
    text: row[1],
    done: row[2] === 'TRUE',
    userEmail: row[3],
    createdAt: row[4],
  }));
}

// Categories operations
export async function saveCategory(name: string, color: string, icon: string, email: string): Promise<boolean> {
  return appendRow('Categorias', [
    Math.random().toString(36).substr(2, 9),
    name,
    color,
    icon,
    email,
  ]);
}

export async function getUserCategories(email: string): Promise<any[]> {
  return querySheet('Categorias', `SELECT * WHERE D = '${email}'`);
}

// Feedback operations
export async function saveFeedback(feedback: FeedbackData): Promise<boolean> {
  return appendRow('Feedback', [
    Math.random().toString(36).substr(2, 9),
    feedback.promptUsed,
    feedback.output,
    feedback.contentType,
    feedback.rating,
    feedback.adjustmentNote || '',
    feedback.userEmail,
    new Date().toISOString(),
  ]);
}

// Check if sheet is configured
export function isSheetConfigured(): boolean {
  return !!SHEET_ID;
}

// Register Google user via Apps Script
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxisbN3OisvH80eEv0jEcTPuOXKr-X-mhYwu915K4IpboR1afYEjl3UldbW91cxDivK/exec';

export async function registerGoogleUser(email: string, name: string, picture?: string): Promise<boolean> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'registerUser',
        email: email,
        name: name,
        password: 'google_oauth',
        company: '',
        website: '',
        audience: '',
        tone: 'casual',
        language: 'Español',
        preferredLength: 'medio'
      }),
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Usuario guardado en Sheets:', data);
      if (data.success) {
        console.log('📧 Email de bienvenida должен быть отправлен автоматически');
      }
      return data.success || false;
    }
    return false;
  } catch (error) {
    console.error('Error al guardar usuario en Sheets:', error);
    return false;
  }
}

// Logout user - register logout time in backend
export async function logoutUser(): Promise<boolean> {
  const email = localStorage.getItem('rm-brain-user-email');
  if (!email) return false;
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'logoutUser',
        email: email
      }),
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Logout registrado:', data);
      return data.success || false;
    }
    return false;
  } catch (error) {
    console.error('Error al registrar logout:', error);
    return false;
  }
}

// Projects operations
export async function saveProject(project: ProjectData): Promise<boolean> {
  if (!SHEET_ID) {
    console.warn('Sheet ID no configurado, guardando solo local');
    return false;
  }
  
  try {
    const values = [
      project.id || Math.random().toString(36).substr(2, 9),
      project.name,
      project.description || '',
      project.resourceIds || '',
      project.createdAt || new Date().toISOString(),
      project.updatedAt || new Date().toISOString(),
      project.userEmail,
    ];
    return await appendRow('Proyectos', values);
  } catch (error) {
    console.error('Error saving project:', error);
    return false;
  }
}

export async function getProjects(email: string): Promise<ProjectData[]> {
  if (!SHEET_ID) return [];
  
  try {
    const rows = await querySheet('Proyectos', `WHERE G = '${email}'`);
    return rows.map((row: any[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      description: row[2] || '',
      resourceIds: row[3] || '',
      createdAt: row[4] || '',
      updatedAt: row[5] || '',
      userEmail: row[6] || '',
    }));
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
}

export async function updateProjectResourceIds(projectId: string, resourceIds: string, userEmail: string): Promise<boolean> {
  if (!SHEET_ID) return false;
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'updateProject',
        projectId: projectId,
        resourceIds: resourceIds,
        userEmail: userEmail,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating project:', error);
    return false;
  }
}

// Export googleSheetsDB for convenience
export const googleSheetsDB = {
  logout: logoutUser,
};

// Sync user data with backend
export async function syncUserWithBackend(email: string, userData: Partial<UserData>): Promise<boolean> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'updateProfile',
        email: email,
        profile: userData
      }),
      mode: 'cors'
    });
    return response.ok;
  } catch (error) {
    console.error('Error sync user:', error);
    return false;
  }
}