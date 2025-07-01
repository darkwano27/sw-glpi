// db/mock-data.js
// Datos simulados para desarrollo cuando la BD no está disponible

const mockUsers = [
  {
    id: 1,
    name: 'Administrador',
    email: 'admin@correo.com',
    password: 'admin123', // En producción debe estar hasheada
    role: 'admin',
    signature_base64: null
  },
  {
    id: 2,
    name: 'Técnico Demo',
    email: 'tecnico@correo.com',
    password: 'tecnico123',
    role: 'tecnico',
    signature_base64: null
  }
];

module.exports = {
  mockUsers
};
