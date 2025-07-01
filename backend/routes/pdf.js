// backend/routes/pdf.js
const express = require('express');
const router = express.Router();
const { generatePDF } = require('../services/pdfService');

module.exports = (appDB, glpiDB) => {
  // Generar y descargar PDF de activos y firmas
  router.post('/', async (req, res) => {
    const { userId, glpiSearch, firmaUsuario } = req.body;
    if (!userId || !glpiSearch) return res.status(400).json({ message: 'Faltan datos' });
    try {
      // Obtener usuario técnico y su firma
      const [users] = await appDB.execute('SELECT id, name, signature_base64 FROM users WHERE id = ?', [userId]);
      if (!users.length) return res.status(404).json({ message: 'Técnico no encontrado' });
      const tecnico = users[0];
      // Buscar usuario GLPI y activos
      const [glpiUsers] = await glpiDB.execute(
        `SELECT u.id, u.name, CONCAT(u.firstname, ' ', u.realname) as full_name, 
                e.email, u.registration_number
         FROM glpi_users u
         LEFT JOIN glpi_useremails e ON u.id = e.users_id AND e.is_default = 1
         WHERE u.is_active = 1 AND u.is_deleted = 0
           AND (u.firstname LIKE ? OR u.realname LIKE ? OR u.name LIKE ?)
         ORDER BY u.realname
         LIMIT 1`,
        [`%${glpiSearch}%`, `%${glpiSearch}%`, `%${glpiSearch}%`]
      );
      if (!glpiUsers.length) return res.status(404).json({ message: 'Usuario GLPI no encontrado' });
      const glpiUser = {
        id: glpiUsers[0].id,
        name: glpiUsers[0].name,
        realname: glpiUsers[0].full_name || glpiUsers[0].name,
        email: glpiUsers[0].email || `${glpiUsers[0].name}@empresa.com`
      };
      const [assets] = await glpiDB.execute(
        `SELECT c.id, c.name, c.serial, c.otherserial, c.comment FROM glpi_computers c WHERE c.users_id = ? AND c.is_deleted = 0`,
        [glpiUser.id]
      );
      // Generar PDF
      const pdfBuffer = await generatePDF({ user: glpiUser, activos: assets, firmaUsuario, firmaTecnico: tecnico.signature_base64 });
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=activos.pdf' });
      res.send(pdfBuffer);
    } catch (dbError) {
      // Si las bases de datos no están disponibles, generar PDF con datos simulados
      console.warn('⚠️  BD no disponible, generando PDF con datos simulados:', dbError.message);
      
      const mockUser = {
        id: 1,
        name: glpiSearch.toUpperCase(),
        realname: `Usuario ${glpiSearch}`,
        email: `${glpiSearch.toLowerCase()}@empresa.com`
      };
      
      const mockAssets = [
        {
          id: 1,
          name: `PC-${glpiSearch.toUpperCase()}-001`,
          otherserial: `SN${Date.now()}`,
          comment: 'Computadora de escritorio - Datos simulados'
        },
        {
          id: 2,
          name: `LAP-${glpiSearch.toUpperCase()}-001`,
          otherserial: `SN${Date.now() + 1}`,
          comment: 'Laptop corporativa - Datos simulados'
        }
      ];
      
      try {
        const pdfBuffer = await generatePDF({ 
          user: mockUser, 
          activos: mockAssets, 
          firmaUsuario, 
          firmaTecnico: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' 
        });
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=activos_simulados.pdf' });
        res.send(pdfBuffer);
      } catch (pdfError) {
        res.status(500).json({ message: 'Error al generar PDF simulado', error: pdfError.message });
      }
    }
  });

  return router;
};
