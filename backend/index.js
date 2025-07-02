// backend/index.js
// Backend principal: Express, conexión a MariaDB, rutas básicas

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const initDB = require('./db/init');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const os = require('os');

// Función para obtener la IP de la red local (mejorada para detectar IP real)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let candidates = [];
  
  console.log('🔍 Detectando interfaces de red...');
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Solo IPv4 no interna
      if (interface.family === 'IPv4' && !interface.internal) {
        const ip = interface.address;
        const interfaceName = name.toLowerCase();
        
        console.log(`   ${name}: ${ip}`);
        
        // Excluir interfaces virtuales conocidas por nombre
        const isVirtual = interfaceName.includes('virtualbox') ||
                         interfaceName.includes('vmware') ||
                         interfaceName.includes('docker') ||
                         interfaceName.includes('hyper-v') ||
                         interfaceName.includes('vethernet') ||
                         interfaceName.includes('loopback');
        
        // Excluir rangos de IP virtuales/especiales
        const isVirtualIP = ip.startsWith('127.') ||          // localhost
                           ip.startsWith('169.254.') ||      // link-local
                           ip.startsWith('172.17.') ||       // docker default
                           ip.startsWith('10.0.2.') ||       // VirtualBox NAT
                           ip.startsWith('192.168.56.') ||   // VirtualBox Host-Only
                           ip.startsWith('192.168.99.') ||   // Docker Machine
                           ip.startsWith('192.168.122.');    // libvirt default
        
        if (!isVirtual && !isVirtualIP) {
          // Calcular prioridad
          let priority = 0;
          
          // Máxima prioridad: tu red específica
          if (ip.startsWith('172.18.')) priority = 100;
          // Alta prioridad: redes comunes
          else if (ip.startsWith('192.168.1.') || ip.startsWith('192.168.0.')) priority = 90;
          // Media prioridad: otras redes privadas
          else if (ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.')) priority = 80;
          // Baja prioridad: IPs públicas (poco común en desarrollo)
          else priority = 70;
          
          candidates.push({ ip, priority, interface: name });
        }
      }
    }
  }
  
  // Ordenar por prioridad descendente
  candidates.sort((a, b) => b.priority - a.priority);
  
  if (candidates.length > 0) {
    const selected = candidates[0];
    console.log(`✅ IP seleccionada: ${selected.ip} (${selected.interface}, prioridad: ${selected.priority})`);
    return selected.ip;
  } else {
    console.log('⚠️  No se encontró IP válida, usando localhost');
    return 'localhost';
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const LOCAL_IP = getLocalIP();

// Configurar CORS dinámicamente
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  `http://${LOCAL_IP}:3000`,
  `http://${LOCAL_IP}:5173`,
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({ 
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️  Origen rechazado: ${origin}`);
      callback(null, true); // En desarrollo, permitir todo
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para debuggear headers grandes
app.use((req, res, next) => {
  const headerSize = JSON.stringify(req.headers).length;
  console.log(`📊 Headers size: ${headerSize} bytes para ${req.method} ${req.path}`);
  
  if (headerSize > 4096) { // Si los headers son > 4KB
    console.warn(`⚠️  Headers muy grandes detectados: ${headerSize} bytes`);
    console.warn(`⚠️  Ruta: ${req.method} ${req.path}`);
    console.warn(`⚠️  User-Agent length: ${req.headers['user-agent']?.length || 0}`);
    console.warn(`⚠️  Cookie length: ${req.headers.cookie?.length || 0}`);
    console.warn(`⚠️  Authorization length: ${req.headers.authorization?.length || 0}`);
    console.warn(`⚠️  Content-Type: ${req.headers['content-type'] || 'N/A'}`);
    
    // Mostrar todos los headers grandes
    Object.keys(req.headers).forEach(key => {
      const value = req.headers[key];
      if (typeof value === 'string' && value.length > 500) {
        console.warn(`⚠️  Header "${key}" muy grande: ${value.length} chars`);
      }
    });
  }
  next();
});

// Middleware para asegurar respuestas JSON
app.use((req, res, next) => {
  // Interceptar el método render para evitar HTML en las APIs
  const originalRender = res.render;
  res.render = function() {
    console.error(`⚠️  Intento de render HTML en ruta API: ${req.path}`);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Esta ruta debe devolver JSON, no HTML'
    });
  };
  
  // Asegurar que las rutas API siempre respondan con JSON
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  next();
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err);
  
  // Si es una ruta API, siempre responder con JSON
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
    });
  }
  
  next(err);
});

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
console.log('🔧 Cargando rutas de autenticación...');
const authRoutes = require('./routes/auth')(appDB);
app.use('/api/auth', authRoutes);
console.log('✅ Rutas de autenticación cargadas');

// Rutas de firmas
console.log('🔧 Cargando rutas de firmas...');
const firmaRoutes = require('./routes/firma')(appDB);
app.use('/api/firma', firmaRoutes);
console.log('✅ Rutas de firmas cargadas');

// Rutas de activos GLPI
console.log('🔧 Cargando rutas de activos...');
const activosRoutes = require('./routes/activos')(glpiDB);
app.use('/api/activos', activosRoutes);
console.log('✅ Rutas de activos cargadas');

// Rutas de PDF (generación y descarga)
console.log('🔧 Cargando rutas de PDF...');
const pdfRoutes = require('./routes/pdf')(appDB, glpiDB);
app.use('/api/pdf', pdfRoutes);
console.log('✅ Rutas de PDF cargadas');

// Rutas de envío de PDF por correo
console.log('🔧 Cargando rutas de email...');
const emailRoutes = require('./routes/email')(appDB, glpiDB);
app.use('/api/email', emailRoutes);
console.log('✅ Rutas de email cargadas');

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API Firma GLPI funcionando');
});

// Middleware para manejar rutas API no encontradas
app.use('/api', (req, res, next) => {
  // Solo manejar si no fue capturado por otras rutas
  console.log(`⚠️  Ruta API no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.path} no existe`,
    method: req.method
  });
});

// Middleware para manejar otras rutas no encontradas
app.use((req, res) => {
  console.log(`⚠️  Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).send('Página no encontrada');
});

// Configurar límites del servidor HTTP y arrancar
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend escuchando en:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Red:      http://${LOCAL_IP}:${PORT}`);
  console.log(`📱 Frontend disponible en:`);
  console.log(`   Local:    http://localhost:3000`);
  console.log(`   Red:      http://${LOCAL_IP}:3000`);
  console.log(`🌐 CORS configurado para: ${allowedOrigins.join(', ')}`);
});

// Configurar límites del servidor HTTP
server.maxHeadersCount = 0; // Sin límite de headers
server.headersTimeout = 60000; // 60 segundos timeout para headers
