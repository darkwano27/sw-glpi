// db/test-connection.js
// Script para probar la conexión a MariaDB y mostrar errores detallados

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.APP_DB_HOST,
      user: process.env.APP_DB_USER,
      password: process.env.APP_DB_PASSWORD,
      database: process.env.APP_DB_NAME,
      port: process.env.APP_DB_PORT || 3306,
    });
    console.log('¡Conexión exitosa a MariaDB!');
    await connection.end();
  } catch (err) {
    console.error('Error de conexión:', err);
  }
}

testConnection();
