// services/pdfService.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF({ user, activos, firmaUsuario, firmaTecnico }) {
  // Generar HTML dinámico para el PDF
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .firmas { display: flex; justify-content: space-between; margin-top: 40px; }
          .firma { text-align: center; }
          .activos { margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; }
        </style>
      </head>
      <body>
        <h2>Activos asignados a ${user.name || user.realname}</h2>
        <div class="activos">
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Serial</th><th>Comentario</th></tr>
            </thead>
            <tbody>
              ${activos.map(a => `<tr><td>${a.id}</td><td>${a.name}</td><td>${a.otherserial || ''}</td><td>${a.comment || ''}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="firmas">
          <div class="firma">
            <div>Firma Usuario</div>
            ${firmaUsuario ? `<img src="data:image/png;base64,${firmaUsuario}" width="150" />` : '<div>(No firmó)</div>'}
          </div>
          <div class="firma">
            <div>Firma Técnico</div>
            ${firmaTecnico ? `<img src="data:image/png;base64,${firmaTecnico}" width="150" />` : '<div>(No asignada)</div>'}
          </div>
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}

module.exports = { generatePDF };
