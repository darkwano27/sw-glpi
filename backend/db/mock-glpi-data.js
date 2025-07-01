// db/mock-glpi-data.js
// Datos simulados de GLPI para desarrollo cuando la BD no está disponible

const mockGLPIUsers = [
  {
    id: 1,
    name: 'emanuel.janampa',
    realname: 'Emanuel Janampa',
    email: 'emanuel.janampa@empresa.com'
  },
  {
    id: 2,
    name: 'admin',
    realname: 'Administrador Sistema',
    email: 'admin@empresa.com'
  },
  {
    id: 3,
    name: 'usuario.demo',
    realname: 'Usuario Demo',
    email: 'demo@empresa.com'
  }
];

const mockGLPIAssets = [
  {
    id: 1,
    name: 'Laptop-001',
    otherserial: 'LP001-2024',
    comment: 'Laptop Dell Inspiron',
    users_id: 1
  },
  {
    id: 2,
    name: 'Desktop-002',
    otherserial: 'DT002-2024',
    comment: 'PC Escritorio HP',
    users_id: 1
  },
  {
    id: 3,
    name: 'Monitor-003',
    otherserial: 'MN003-2024',
    comment: 'Monitor Samsung 24"',
    users_id: 2
  }
];

module.exports = {
  mockGLPIUsers,
  mockGLPIAssets
};
