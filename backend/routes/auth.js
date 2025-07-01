// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { mockUsers } = require('../db/mock-data');
const router = express.Router();

module.exports = (appDB) => {
  // Login
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });
    
    try {
      // Intentar conectar a la BD primero
      const [rows] = await appDB.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Usuario no encontrado' });
      const user = rows[0];
      
      // Verificar contraseña: puede estar hasheada o en texto plano
      let match = false;
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        // Contraseña hasheada con bcrypt
        match = await bcrypt.compare(password, user.password);
      } else {
        // Contraseña en texto plano (inseguro, solo para desarrollo)
        match = (password === user.password);
      }
      
      if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch (dbError) {
      // Si la BD falla, usar datos simulados
      console.warn('⚠️  BD no disponible, usando datos simulados:', dbError.message);
      const user = mockUsers.find(u => u.email === email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, role: user.role, email: user.email },
        warning: 'Usando datos simulados - BD no disponible'
      });
    }
  });

  // Registro de usuario (solo admin)
  router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'Faltan campos' });
    try {
      const hash = await bcrypt.hash(password, 10);
      await appDB.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, role]);
      res.json({ message: 'Usuario creado' });
    } catch (err) {
      res.status(500).json({ message: 'Error al registrar usuario', error: err.message });
    }
  });

  // Listar usuarios (solo admin)
  router.get('/users', async (req, res) => {
    try {
      const [rows] = await appDB.execute('SELECT id, name, email, role, signature_base64 FROM users');
      res.json(rows);
    } catch (dbError) {
      // Si la BD falla, usar datos simulados
      console.warn('⚠️  BD no disponible, usando datos simulados:', dbError.message);
      res.json(mockUsers.map(u => ({ 
        id: u.id, 
        name: u.name, 
        email: u.email, 
        role: u.role, 
        signature_base64: u.signature_base64 
      })));
    }
  });

  // Eliminar usuario técnico
  router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await appDB.execute('DELETE FROM users WHERE id = ?', [id]);
      res.json({ message: 'Usuario eliminado' });
    } catch (err) {
      res.status(500).json({ message: 'Error al eliminar usuario', error: err.message });
    }
  });

  return router;
};
