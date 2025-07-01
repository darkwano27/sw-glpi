// backend/routes/firma.js
const express = require('express');
const { mockUsers } = require('../db/mock-data');
const router = express.Router();

module.exports = (appDB) => {
  // Asignar firma base64 a un técnico (solo admin)
  router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { signature_base64 } = req.body;
    if (!signature_base64) return res.status(400).json({ message: 'Firma requerida' });
    try {
      await appDB.execute('UPDATE users SET signature_base64 = ? WHERE id = ?', [signature_base64, userId]);
      res.json({ message: 'Firma asignada correctamente' });
    } catch (dbError) {
      // Si la BD falla, simular la asignación
      console.warn('⚠️  BD no disponible, simulando asignación de firma:', dbError.message);
      const user = mockUsers.find(u => u.id == userId);
      if (user) {
        user.signature_base64 = signature_base64;
        res.json({ message: 'Firma asignada correctamente (simulado)' });
      } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
      }
    }
  });

  // Consultar firma de un usuario
  router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const [rows] = await appDB.execute('SELECT signature_base64 FROM users WHERE id = ?', [userId]);
      if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json({ signature_base64: rows[0].signature_base64 });
    } catch (dbError) {
      // Si la BD falla, usar datos simulados
      console.warn('⚠️  BD no disponible, usando datos simulados:', dbError.message);
      const user = mockUsers.find(u => u.id == userId);
      if (user) {
        res.json({ signature_base64: user.signature_base64 });
      } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
      }
    }
  });

  return router;
};
