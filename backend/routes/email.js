// backend/routes/email.js
const express = require('express');
const router = express.Router();
const { generatePDF } = require('../services/pdfService');
const { sendPDFMail } = require('../services/emailService');
const { mockUsers } = require('../db/mock-data');
const { mockGLPIUsers, mockGLPIAssets } = require('../db/mock-glpi-data');

module.exports = (appDB, glpiDB) => {
  // Enviar PDF por correo
  router.post('/send-pdf', async (req, res) => {
    const { userId, glpiSearch, firmaUsuario, email } = req.body;
    if (!userId || !glpiSearch) return res.status(400).json({ message: 'Faltan datos' });
    
    try {
      // Obtener usuario técnico y su firma
      let tecnico;
      try {
        const [users] = await appDB.execute('SELECT id, name, signature_base64 FROM users WHERE id = ?', [userId]);
        if (!users.length) return res.status(404).json({ message: 'Técnico no encontrado' });
        tecnico = users[0];
      } catch (dbError) {
        // Si la BD local falla, usar datos simulados
        console.warn('⚠️  BD local no disponible, usando datos simulados:', dbError.message);
        tecnico = mockUsers.find(u => u.id == userId);
        if (!tecnico) return res.status(404).json({ message: 'Técnico no encontrado' });
      }

      // Buscar usuario GLPI y activos
      let glpiUser, assets;
      try {
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
        glpiUser = {
          id: glpiUsers[0].id,
          name: glpiUsers[0].name,
          realname: glpiUsers[0].full_name || glpiUsers[0].name,
          email: glpiUsers[0].email || `${glpiUsers[0].name}@empresa.com`
        };
        
        const [glpiAssets] = await glpiDB.execute(
          `SELECT c.id, c.name, c.serial, c.otherserial, c.comment FROM glpi_computers c WHERE c.users_id = ? AND c.is_deleted = 0`,
          [glpiUser.id]
        );
        assets = glpiAssets;
      } catch (dbError) {
        // Si GLPI falla, usar datos simulados
        console.warn('⚠️  GLPI no disponible, usando datos simulados:', dbError.message);
        glpiUser = mockGLPIUsers.find(u => 
          u.name.toLowerCase().includes(glpiSearch.toLowerCase()) ||
          u.realname.toLowerCase().includes(glpiSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(glpiSearch.toLowerCase())
        );
        if (!glpiUser) {
          glpiUser = {
            id: 1,
            name: glpiSearch.toLowerCase(),
            realname: `Usuario ${glpiSearch}`,
            email: `${glpiSearch.toLowerCase()}@empresa.com`
          };
        }
        assets = mockGLPIAssets.filter(a => a.users_id == glpiUser.id);
        if (assets.length === 0) {
          assets = [
            {
              id: 1,
              name: `PC-${glpiSearch.toUpperCase()}-001`,
              otherserial: `SN${Date.now()}`,
              comment: 'Computadora - Datos simulados'
            }
          ];
        }
      }

      // Generar PDF
      const pdfBuffer = await generatePDF({ 
        user: glpiUser, 
        activos: assets, 
        firmaUsuario, 
        firmaTecnico: tecnico.signature_base64 
      });

      // Determinar correo destinatario
      const destinatario = email || glpiUser.email;
      if (!destinatario) {
        return res.status(400).json({ 
          message: 'No hay correo para enviar el PDF',
          error: 'MISSING_EMAIL'
        });
      }

      console.log(`📧 Intentando enviar PDF a: ${destinatario}`);
      console.log(`👤 Usuario GLPI: ${glpiUser.realname || glpiUser.name}`);
      console.log(`👨‍💻 Técnico: ${tecnico.name}`);

      try {
        const result = await sendPDFMail({
          to: destinatario,
          subject: `Activos GLPI - ${glpiUser.realname || glpiUser.name}`,
          text: `Se adjunta el PDF con los activos asignados y las firmas correspondientes.\n\nUsuario: ${glpiUser.realname || glpiUser.name}\nTécnico: ${tecnico.name}\n\nFecha: ${new Date().toLocaleString('es-PE')}`,
          pdfBuffer,
          filename: `activos_${glpiUser.name}_${new Date().toISOString().split('T')[0]}.pdf`
        });

        res.json({ 
          success: true,
          message: 'PDF enviado correctamente', 
          destinatario: destinatario,
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });

      } catch (emailError) {
        console.error('❌ Error detallado al enviar email:', emailError);
        
        // Clasificar el error y dar una respuesta específica
        let errorMessage = 'Error desconocido al enviar email';
        let errorCode = 'UNKNOWN_ERROR';
        
        if (emailError.type) {
          switch (emailError.type) {
            case 'email_invalido':
              errorMessage = `El email "${destinatario}" no es válido`;
              errorCode = 'INVALID_EMAIL';
              break;
            case 'conexion_smtp':
              errorMessage = 'No se puede conectar al servidor de correo';
              errorCode = 'SMTP_CONNECTION_ERROR';
              break;
            case 'autenticacion':
              errorMessage = 'Error de autenticación con el servidor de correo';
              errorCode = 'SMTP_AUTH_ERROR';
              break;
            default:
              errorMessage = emailError.message || 'Error al enviar email';
              errorCode = 'EMAIL_SEND_ERROR';
          }
        } else {
          errorMessage = emailError.message || 'Error al enviar email';
        }

        res.status(500).json({ 
          success: false,
          message: 'PDF generado correctamente, pero falló el envío del email', 
          destinatario: destinatario,
          error: errorMessage,
          errorCode: errorCode,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error general en envío de PDF:', err);
      res.status(500).json({ message: 'Error al procesar PDF', error: err.message });
    }
  });

  return router;
};
