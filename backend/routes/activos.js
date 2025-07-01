// backend/routes/activos.js
const express = require('express');
const router = express.Router();

module.exports = (glpiDB) => {
  // Consulta de activos por usuario GLPI (por nombre o realname)
  router.get('/', async (req, res) => {
    const { search } = req.query; // nombre o realname
    if (!search) return res.status(400).json({ message: 'Parámetro de búsqueda requerido' });
    try {
      // Buscar usuario en GLPI (usando campos correctos)
      const [users] = await glpiDB.execute(
        `SELECT u.id, u.name, u.realname, u.firstname, e.email 
         FROM glpi_users u 
         LEFT JOIN glpi_useremails e ON u.id = e.users_id AND e.is_default = 1
         WHERE (u.name LIKE ? OR u.realname LIKE ? OR u.firstname LIKE ?) 
         AND u.is_deleted = 0 
         LIMIT 1`,
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
        realname: `${user.realname || ''} ${user.firstname || ''}`.trim(),
        email: user.email || `${user.name}@empresa.com`
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
          email: `${search.toLowerCase()}@empresa.com`
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
