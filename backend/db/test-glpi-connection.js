// db/test-glpi-connection.js
// Script para probar específicamente la conexión a GLPI

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function testGLPIConnection() {
  console.log('🔍 Probando conexión a GLPI...');
  console.log('📋 Configuración:');
  console.log('   Host:', process.env.GLPI_DB_HOST);
  console.log('   Puerto:', process.env.GLPI_DB_PORT || 3306);
  console.log('   Usuario:', process.env.GLPI_DB_USER);
  console.log('   Base de datos:', process.env.GLPI_DB_NAME);
  
  try {
    // Intentar conectar
    console.log('\n🔌 Intentando conectar...');
    const connection = await mysql.createConnection({
      host: process.env.GLPI_DB_HOST,
      user: process.env.GLPI_DB_USER,
      password: process.env.GLPI_DB_PASSWORD,
      database: process.env.GLPI_DB_NAME,
      port: process.env.GLPI_DB_PORT || 3306,
      timeout: 10000
    });

    console.log('✅ ¡Conexión exitosa a GLPI!');

    // Probar consultas básicas
    console.log('\n📊 Probando consultas...');
    
    // 1. Verificar tablas principales
    const [tables] = await connection.execute('SHOW TABLES LIKE "glpi_users"');
    if (tables.length === 0) {
      console.log('❌ Tabla glpi_users no encontrada');
      await connection.end();
      return;
    }
    console.log('✅ Tabla glpi_users encontrada');

    // 2. Contar usuarios
    const [userCount] = await connection.execute('SELECT COUNT(*) as total FROM glpi_users WHERE is_deleted = 0');
    console.log(`📈 Total de usuarios activos: ${userCount[0].total}`);

    // 3. Mostrar algunos usuarios
    const [users] = await connection.execute(
      'SELECT id, name, realname, email FROM glpi_users WHERE is_deleted = 0 AND name != "" LIMIT 5'
    );
    console.log('\n👥 Usuarios de ejemplo:');
    users.forEach(user => {
      console.log(`   ${user.id}: ${user.name} (${user.realname}) - ${user.email || 'Sin email'}`);
    });

    // 4. Verificar tabla de computadoras
    const [computers] = await connection.execute('SHOW TABLES LIKE "glpi_computers"');
    if (computers.length > 0) {
      const [compCount] = await connection.execute('SELECT COUNT(*) as total FROM glpi_computers WHERE is_deleted = 0');
      console.log(`💻 Total de computadoras activas: ${compCount[0].total}`);
    }

    // 5. Probar búsqueda específica
    console.log('\n🔍 Probando búsqueda de usuario "emanuel"...');
    const [searchResults] = await connection.execute(
      `SELECT id, name, realname, email FROM glpi_users 
       WHERE (name LIKE ? OR realname LIKE ? OR email LIKE ?) 
       AND is_deleted = 0 LIMIT 5`,
      ['%emanuel%', '%emanuel%', '%emanuel%']
    );
    
    if (searchResults.length > 0) {
      console.log('✅ Usuarios encontrados:');
      searchResults.forEach(user => {
        console.log(`   ${user.id}: ${user.name} (${user.realname}) - ${user.email || 'Sin email'}`);
      });
    } else {
      console.log('⚠️  No se encontraron usuarios con "emanuel"');
    }

    await connection.end();
    console.log('\n✅ Prueba completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error de conexión a GLPI:');
    console.error('   Código:', error.code);
    console.error('   Mensaje:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Posibles soluciones:');
      console.error('   1. Verificar que el servidor GLPI esté funcionando');
      console.error('   2. Verificar conectividad de red (ping solucionesti.aris.com.pe)');
      console.error('   3. Verificar que el puerto 3306 esté abierto');
      console.error('   4. Verificar credenciales de acceso');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔧 El dominio no se puede resolver');
      console.error('   1. Verificar que solucionesti.aris.com.pe sea correcto');
      console.error('   2. Verificar configuración DNS');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔧 Credenciales incorrectas');
      console.error('   1. Verificar usuario y contraseña');
      console.error('   2. Verificar permisos del usuario en la base de datos');
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testGLPIConnection();
}

module.exports = testGLPIConnection;
