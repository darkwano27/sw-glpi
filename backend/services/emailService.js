// services/emailService.js
const nodemailer = require('nodemailer');

// Crear transportador con mejor configuración
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true para puerto 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Solo para desarrollo
  }
});

// Función para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para verificar conexión SMTP
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('✅ Servidor SMTP conectado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión SMTP:', error.message);
    return false;
  }
}

async function sendPDFMail({ to, subject, text, pdfBuffer, filename = 'activos.pdf' }) {
  try {
    // Validar email destinatario
    if (!to || !isValidEmail(to)) {
      throw new Error(`Email destinatario inválido: ${to}`);
    }

    // Verificar conexión SMTP
    const isConnected = await verifyConnection();
    if (!isConnected) {
      throw new Error('No se puede conectar al servidor SMTP');
    }

    console.log(`📧 Enviando email a: ${to}`);
    console.log(`📋 Asunto: ${subject}`);
    
    const mailOptions = {
      from: `"Sistema Firmas GLPI" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: `
        <h3>${subject}</h3>
        <p>${text}</p>
        <p><strong>Archivo adjunto:</strong> ${filename}</p>
        <hr>
        <small>Este email fue enviado automáticamente por el Sistema de Firmas GLPI</small>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado exitosamente');
    console.log('📨 Message ID:', result.messageId);
    console.log('📬 Respuesta del servidor:', result.response);
    
    return {
      success: true,
      messageId: result.messageId,
      destinatario: to
    };

  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    
    // Clasificar tipos de error
    let errorType = 'general';
    if (error.message.includes('invalid')) {
      errorType = 'email_invalido';
    } else if (error.message.includes('SMTP') || error.message.includes('connect')) {
      errorType = 'conexion_smtp';
    } else if (error.message.includes('auth') || error.message.includes('authentication')) {
      errorType = 'autenticacion';
    }
    
    throw {
      type: errorType,
      message: error.message,
      originalError: error
    };
  }
}

module.exports = { 
  sendPDFMail, 
  verifyConnection, 
  isValidEmail 
};
