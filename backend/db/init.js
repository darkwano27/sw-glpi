// db/init.js
// Inicializa las tablas necesarias en la base de datos local (signature_wizard)

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.APP_DB_HOST,
      user: process.env.APP_DB_USER,
      password: process.env.APP_DB_PASSWORD,
      database: process.env.APP_DB_NAME,
      port: process.env.APP_DB_PORT || 3306,
    });

    // Tabla de usuarios (admin y técnicos)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'tecnico') NOT NULL,
        signature_base64 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Tabla de logs de firmas (opcional, para auditoría)
    await connection.execute(`      CREATE TABLE IF NOT EXISTS signature_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        signed_by INT,
        signature_base64 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    await connection.end();
    console.log('✅ Tablas inicializadas correctamente.');
  } catch (error) {
    console.error('❌ Error al conectar o inicializar la base de datos:');
    console.error('   Host:', process.env.APP_DB_HOST);
    console.error('   Puerto:', process.env.APP_DB_PORT || 3306);
    console.error('   Usuario:', process.env.APP_DB_USER);
    console.error('   Base de datos:', process.env.APP_DB_NAME);
    console.error('   Error:', error.message);
    throw error;
  }
}

if (require.main === module) {
  initDB().catch(err => {
    console.error('Error al inicializar la base de datos:', err);
  });
}

module.exports = initDB;
