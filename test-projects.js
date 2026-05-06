// Script de prueba para verificar las funciones de proyectos
// Ejecutar en la consola del navegador después de iniciar sesión

async function testProjects() {
  console.log('🧪 Probando funciones de proyectos...');

  const userEmail = 'tu-email-aqui@ejemplo.com'; // Reemplazar con un email real

  try {
    // 1. Crear un proyecto de prueba
    console.log('1. Creando proyecto de prueba...');
    const testProject = {
      id: 'test_' + Date.now(),
      name: 'Proyecto de Prueba',
      description: 'Descripción de prueba',
      resourceIds: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userEmail: userEmail
    };

    // Importar la función (ajustar según tu configuración)
    const { saveProject } = await import('./lib/googleSheetsDB.js');
    const saveResult = await saveProject(testProject);
    console.log('Resultado de guardar proyecto:', saveResult);

    // 2. Obtener proyectos
    console.log('2. Obteniendo proyectos...');
    const { getProjects } = await import('./lib/googleSheetsDB.js');
    const projects = await getProjects(userEmail);
    console.log('Proyectos obtenidos:', projects);

    // 3. Actualizar proyecto con recursos
    if (projects.length > 0) {
      console.log('3. Actualizando proyecto con recursos...');
      const { updateProjectResourceIds } = await import('./lib/googleSheetsDB.js');
      const updateResult = await updateProjectResourceIds(projects[0].id, 'res1,res2,res3', userEmail);
      console.log('Resultado de actualizar proyecto:', updateResult);
    }

    console.log('✅ Pruebas completadas');

  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  }
}

// Ejecutar la prueba
testProjects();