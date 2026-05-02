/**
 * NOTA IMPORTANTE: Problema de CORS con Google Apps Script
 * 
 * El error "Access to fetch has been blocked by CORS policy" es un problema conocido
 * con Google Apps Script cuando se hace fetch desde un dominio diferente.
 * 
 * SOLUCIONES:
 * 
 * 1. OPCIÓN SIMPLE (usar ahora):
 *    El código actual tiene un fallback que usa modo demo cuando hay error de CORS.
 *    El usuario puede probar la app pero los datos no se guardan en Sheets.
 * 
 * 2. OPCIÓN RECOMENDADA - Usar Google Identity Services:
 *    Implementar el flujo completo de OAuth usando la biblioteca oficial de Google
 *    que maneja el CORS automáticamente.
 * 
 * 3. OPCIÓN ALTERNATIVA - Usar un proxy:
 *    Crear un servidor proxy que reciba las peticiones y las reenvíe al Apps Script.
 * 
 * Para你家 aplicación, te recomiendo implementar Google Identity Services (Opción 2).
 * ¿Quieres que agregue esa implementación?
 */