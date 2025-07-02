#!/bin/bash

# Script para iniciar la aplicación de forma dinámica
echo "🚀 Iniciando aplicación Firma GLPI..."

# Detectar IP de la red local
get_local_ip() {
    # Buscar IP que no sea localhost ni docker
    ip route get 8.8.8.8 | awk '{print $7; exit}' 2>/dev/null || \
    hostname -I | awk '{print $1}' 2>/dev/null || \
    ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1 || \
    echo "localhost"
}

LOCAL_IP=$(get_local_ip)
BACKEND_PORT=3001
FRONTEND_PORT=3000

echo "🌐 IP detectada: $LOCAL_IP"
echo "🔧 Configurando variables de entorno..."

# Actualizar archivo .env dinámicamente
cat > .env << EOF
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

# Security (permitir todas las IPs en desarrollo)
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ Archivo .env actualizado"

# Función para matar procesos anteriores
cleanup() {
    echo "🛑 Deteniendo procesos anteriores..."
    pkill -f "node.*index.js" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    sleep 2
}

# Iniciar backend
start_backend() {
    echo "🖥️  Iniciando backend..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo "Backend PID: $BACKEND_PID"
}

# Iniciar frontend
start_frontend() {
    echo "🌐 Iniciando frontend..."
    HOST=0.0.0.0 PORT=$FRONTEND_PORT npm start &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
}

# Cleanup al salir
trap cleanup EXIT

# Limpiar procesos anteriores
cleanup

# Iniciar servicios
start_backend
sleep 5
start_frontend

echo ""
echo "🎉 Aplicación iniciada exitosamente!"
echo "📊 Información de acceso:"
echo "   Backend:  http://$LOCAL_IP:$BACKEND_PORT"
echo "   Frontend: http://$LOCAL_IP:$FRONTEND_PORT"
echo ""
echo "📱 Para acceder desde otros dispositivos en la red:"
echo "   URL: http://$LOCAL_IP:$FRONTEND_PORT"
echo ""
echo "⌨️  Presiona Ctrl+C para detener todos los servicios"

# Esperar a que termine
wait
