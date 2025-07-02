# Script PowerShell para iniciar la aplicación de forma dinámica
Write-Host "🚀 Iniciando aplicación Firma GLPI..." -ForegroundColor Green

# Detectar IP de la red local
function Get-LocalIP {
    try {
        # Obtener IP de la interfaz de red activa
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
            $_.IPAddress -notlike "127.*" -and 
            $_.IPAddress -notlike "169.254.*" -and 
            $_.IPAddress -notlike "172.17.*" -and
            $_.PrefixOrigin -eq "Dhcp"
        } | Select-Object -First 1).IPAddress
        
        if ($ip) { return $ip }
        else { return "localhost" }
    }
    catch {
        return "localhost"
    }
}

$LOCAL_IP = Get-LocalIP
$BACKEND_PORT = 3001
$FRONTEND_PORT = 3000

Write-Host "🌐 IP detectada: $LOCAL_IP" -ForegroundColor Cyan
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Yellow

# Crear archivo .env dinámico
$envContent = @"
# Application Database Configuration
APP_DB_HOST=172.18.20.107
APP_DB_USER=firma_user
APP_DB_PASSWORD=clave_segura123
APP_DB_PORT=3306
APP_DB_NAME=firma_glpi_nueva

# GLPI Database Configuration
GLPI_DB_HOST=solucionesti.aris.com.pe
GLPI_DB_USER=glpi
GLPI_DB_PASSWORD=GLPI_PASS
GLPI_DB_NAME=glpidb
GLPI_DB_PORT=3306

# JWT Configuration
JWT_SECRET=a_much_more_secure_and_random_jwt_secret_key_that_is_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=qui.vta091.aris@gmail.com
SMTP_PASSWORD=svze iolf vosk yncq

# Server Configuration
PORT=$BACKEND_PORT
NODE_ENV=development

# Security
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Archivo .env actualizado" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Configuración completada!" -ForegroundColor Green
Write-Host "📊 Información de acceso:" -ForegroundColor White
Write-Host "   Backend:  http://$LOCAL_IP`:$BACKEND_PORT" -ForegroundColor Cyan
Write-Host "   Frontend: http://$LOCAL_IP`:$FRONTEND_PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Para acceder desde otros dispositivos:" -ForegroundColor Yellow
Write-Host "   URL: http://$LOCAL_IP`:$FRONTEND_PORT" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚙️  Ahora ejecuta:" -ForegroundColor White
Write-Host "   Backend:  cd backend && npm run dev" -ForegroundColor Gray
Write-Host "   Frontend: npm start" -ForegroundColor Gray
