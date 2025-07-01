// db/explore-glpi-schema.js
// Script para explorar la estructura real de GLPI

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function exploreGLPISchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.GLPI_DB_HOST,
      user: process.env.GLPI_DB_USER,
      password: process.env.GLPI_DB_PASSWORD,
      database: process.env.GLPI_DB_NAME,
      port: process.env.GLPI_DB_PORT || 3306
    });

    console.log('🔍 Explorando estructura de GLPI...\n');

    // 1. Explorar tabla glpi_users
    console.log('📋 Estructura de glpi_users:');
    const [userFields] = await connection.execute('DESCRIBE glpi_users');
    userFields.forEach(field => {
      console.log(`   ${field.Field} (${field.Type}) - ${field.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 2. Buscar tabla de emails
    console.log('\n📧 Buscando tablas relacionadas con emails...');
    const [emailTables] = await connection.execute('SHOW TABLES LIKE "%email%"');
    emailTables.forEach(table => {
      console.log(`   ${Object.values(table)[0]}`);
    });

    // 3. Buscar tabla de contactos/usuarios
    console.log('\n👥 Buscando tablas de contactos...');
    const [contactTables] = await connection.execute('SHOW TABLES LIKE "%contact%"');
    contactTables.forEach(table => {
      console.log(`   ${Object.values(table)[0]}`);
    });

    // 4. Probar consulta básica de usuarios
    console.log('\n👤 Usuarios de ejemplo (sin email):');
    const [users] = await connection.execute(
      'SELECT id, name, realname, firstname, phone FROM glpi_users WHERE is_deleted = 0 AND name != "" LIMIT 5'
    );
    users.forEach(user => {
      console.log(`   ${user.id}: ${user.name} - ${user.realname} ${user.firstname} - Tel: ${user.phone || 'N/A'}`);
    });

    // 5. Buscar usuario específico
    console.log('\n🔍 Buscando usuario "emanuel":');
    const [searchResults] = await connection.execute(
      `SELECT id, name, realname, firstname, phone FROM glpi_users 
       WHERE (name LIKE ? OR realname LIKE ? OR firstname LIKE ?) 
       AND is_deleted = 0 LIMIT 5`,
      ['%emanuel%', '%emanuel%', '%emanuel%']
    );
    
    if (searchResults.length > 0) {
      console.log('✅ Usuarios encontrados:');
      searchResults.forEach(user => {
        console.log(`   ${user.id}: ${user.name} - ${user.realname} ${user.firstname} - Tel: ${user.phone || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No se encontraron usuarios con "emanuel"');
    }

    // 6. Explorar tabla de computadoras
    console.log('\n💻 Estructura de glpi_computers:');
    const [compFields] = await connection.execute('DESCRIBE glpi_computers');
    compFields.slice(0, 10).forEach(field => {
      console.log(`   ${field.Field} (${field.Type})`);
    });

    // 7. Buscar computadoras asignadas a usuarios
    console.log('\n🔗 Computadoras asignadas a usuarios:');
    const [computers] = await connection.execute(`
      SELECT c.id, c.name, c.otherserial, c.users_id, u.name as username 
      FROM glpi_computers c 
      LEFT JOIN glpi_users u ON c.users_id = u.id 
      WHERE c.is_deleted = 0 AND c.users_id > 0 
      LIMIT 5
    `);
    computers.forEach(comp => {
      console.log(`   ${comp.id}: ${comp.name} (${comp.otherserial}) -> Usuario: ${comp.username} (ID: ${comp.users_id})`);
    });

    await connection.end();
    console.log('\n✅ Exploración completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  exploreGLPISchema();
}

module.exports = exploreGLPISchema;
