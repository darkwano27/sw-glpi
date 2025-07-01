// backend/index.js
// Backend principal: Express, conexión a MariaDB, rutas básicas

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const initDB = require('./db/init');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

// Inicializar tablas al arrancar (sin bloquear el servidor si falla)
initDB().catch(err => {
  console.error('⚠️  Error al inicializar la base de datos:', err.message);
  console.error('⚠️  El servidor seguirá funcionando, pero las operaciones de BD fallarán');
});

// Pool de conexión a la base de datos local
const appDB = mysql.createPool({
  host: process.env.APP_DB_HOST,
  user: process.env.APP_DB_USER,
  password: process.env.APP_DB_PASSWORD,
  database: process.env.APP_DB_NAME,
  port: process.env.APP_DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Pool de conexión a la base de datos GLPI
const glpiDB = mysql.createPool({
  host: process.env.GLPI_DB_HOST,
  user: process.env.GLPI_DB_USER,
  password: process.env.GLPI_DB_PASSWORD,
  database: process.env.GLPI_DB_NAME,
  port: process.env.GLPI_DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Rutas de autenticación y usuarios
const authRoutes = require('./routes/auth')(appDB);
app.use('/api/auth', authRoutes);

// Rutas de firmas
const firmaRoutes = require('./routes/firma')(appDB);
app.use('/api/firma', firmaRoutes);

// Rutas de activos GLPI
const activosRoutes = require('./routes/activos')(glpiDB);
app.use('/api/activos', activosRoutes);

// Rutas de PDF (generación y descarga)
const pdfRoutes = require('./routes/pdf')(appDB, glpiDB);
app.use('/api/pdf', pdfRoutes);

// Rutas de envío de PDF por correo
const emailRoutes = require('./routes/email')(appDB, glpiDB);
app.use('/api/email', emailRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API Firma GLPI funcionando');
});

// Aquí irán las rutas de usuarios, firmas, activos, etc.

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend escuchando en http://172.18.22.9:${PORT}`);
  console.log(`📱 Acceso desde móvil: http://172.18.22.9:3000`);
});
