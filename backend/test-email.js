// test-email.js
// Script para probar el servicio de email

require('dotenv').config({ path: '../.env' });
const { sendPDFMail, verifyConnection, isValidEmail } = require('./services/emailService');

async function testEmailService() {
  console.log('🔍 Probando servicio de email...\n');

  // 1. Verificar configuración
  console.log('📋 Configuración SMTP:');
  console.log('   Host:', process.env.SMTP_HOST);
  console.log('   Puerto:', process.env.SMTP_PORT);
  console.log('   Usuario:', process.env.SMTP_USER);
  console.log('   Contraseña:', process.env.SMTP_PASSWORD ? '***configurada***' : '❌ NO CONFIGURADA');

  // 2. Verificar conexión
  console.log('\n🔌 Verificando conexión SMTP...');
  const isConnected = await verifyConnection();
  
  if (!isConnected) {
    console.log('❌ No se puede continuar sin conexión SMTP');
    return;
  }

  // 3. Probar validación de emails
  console.log('\n📧 Probando validación de emails...');
  const testEmails = [
    'ejanampa@aris.com.pe',
    'test@empresa.com',
    'email_invalido',
    'otro@gmail.com'
  ];

  testEmails.forEach(email => {
    const isValid = isValidEmail(email);
    console.log(`   ${email}: ${isValid ? '✅ Válido' : '❌ Inválido'}`);
  });

  // 4. Probar envío de email (sin PDF para simplificar)
  console.log('\n📨 Probando envío de email de prueba...');
  
  const testRecipient = process.env.SMTP_USER; // Enviar a nosotros mismos
  
  try {
    const result = await sendPDFMail({
      to: testRecipient,
      subject: 'Prueba - Sistema Firmas GLPI',
      text: 'Este es un email de prueba del sistema de firmas GLPI.',
      pdfBuffer: Buffer.from('PDF de prueba'), // Buffer falso para la prueba
      filename: 'prueba.pdf'
    });

    console.log('✅ Email de prueba enviado exitosamente');
    console.log('📨 Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Error en email de prueba:', error.message);
    console.error('🔧 Tipo de error:', error.type || 'desconocido');
  }

  console.log('\n✅ Prueba de email completada');
}

if (require.main === module) {
  testEmailService().catch(console.error);
}

module.exports = testEmailService;
