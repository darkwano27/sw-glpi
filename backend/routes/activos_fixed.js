// Archivo comentado: No usar. Ver 'routes/activos.js' para la versión activa.
/*
// backend/routes/activos.js
const express = require('express');
const router = express.Router();

module.exports = (glpiDB) => {
  // Consulta de activos por usuario GLPI (por nombre o realname)
  router.get('/', async (req, res) => {
    const { search } = req.query; // nombre o realname
    if (!search) return res.status(400).json({ message: 'Parámetro de búsqueda requerido' });
    try {
      // Buscar usuario en GLPI (usando consulta mejorada)
      const [users] = await glpiDB.execute(
        `SELECT u.id, u.name, CONCAT(u.firstname, ' ', u.realname) as full_name, 
                e.email, u.registration_number
         FROM glpi_users u
         LEFT JOIN glpi_useremails e ON u.id = e.users_id AND e.is_default = 1
         WHERE u.is_active = 1 AND u.is_deleted = 0
           AND (u.firstname LIKE ? OR u.realname LIKE ? OR u.name LIKE ?)
         ORDER BY u.realname
         LIMIT 10`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      );
      
      if (!users.length) return res.status(404).json({ message: 'Usuario GLPI no encontrado' });
      const user = users[0];
      
      // Buscar activos asignados (computadoras)
      const [assets] = await glpiDB.execute(
        `SELECT c.id, c.name, c.serial, c.otherserial, c.comment 
         FROM glpi_computers c 
         WHERE c.users_id = ? AND c.is_deleted = 0`,
        [user.id]
      );
      
      // Formatear respuesta
      const userInfo = {
        id: user.id,
        name: user.name,
        realname: user.full_name || user.name,
        email: user.email || `${user.name}@empresa.com`,
        registration_number: user.registration_number
      };
      
      res.json({ user: userInfo, activos: assets });
    } catch (dbError) {
      // Si GLPI no está disponible, devolver datos simulados
      console.warn('⚠️  GLPI no disponible, usando datos simulados:', dbError.message);
      const mockData = {
        user: {
          id: 1,
          name: search.toLowerCase(),
          realname: `Usuario ${search}`,
          email: `${search.toLowerCase()}@empresa.com`,
          registration_number: '0000'
        },
        activos: [
          {
            id: 1,
            name: `PC-${search.toUpperCase()}-001`,
            serial: `SN${Date.now()}`,
            otherserial: `SN${Date.now()}`,
            comment: 'Computadora de escritorio - Datos simulados'
          },
          {
            id: 2,
            name: `LAP-${search.toUpperCase()}-001`,
            serial: `SN${Date.now() + 1}`,
            otherserial: `SN${Date.now() + 1}`,
            comment: 'Laptop corporativa - Datos simulados'
          }
        ]
      };
      res.json(mockData);
    }
  });

  return router;
};
*/
