#!/bin/bash

# Script de despliegue para Rocky Linux
echo "🚀 Iniciando despliegue de Firma GLPI..."

# Variables
APP_DIR="/opt/sw-glpi"
USER="firma-app"
REPO_URL="https://github.com/darkwano27/sw-glpi.git"
BRANCH="gpt-branch"

# Crear usuario del sistema si no existe
if ! id "$USER" &>/dev/null; then
    echo "👤 Creando usuario del sistema..."
    sudo useradd -r -s /bin/false $USER
fi

# Crear directorios necesarios
echo "📁 Creando directorios..."
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/log/nginx

# Instalar dependencias del sistema
echo "📦 Instalando dependencias..."
sudo dnf update -y
sudo dnf install -y nodejs npm git nginx firewalld

# Instalar PM2 globalmente
echo "⚙️ Instalando PM2..."
sudo npm install -g pm2

# Clonar el repositorio específico con la rama gpt-branch
echo "📥 Clonando repositorio desde GitHub..."
if [ -d "$APP_DIR" ]; then
    echo "⚠️  Directorio ya existe, actualizando..."
    cd $APP_DIR
    sudo git fetch origin
    sudo git checkout $BRANCH
    sudo git pull origin $BRANCH
else
    echo "📦 Clonando repositorio..."
    sudo git clone -b $BRANCH $REPO_URL $APP_DIR
fi

# Instalar dependencias de la aplicación
echo "📦 Instalando dependencias del backend..."
cd $APP_DIR/backend
sudo npm install --production

echo "📦 Instalando dependencias del frontend y construyendo..."
cd $APP_DIR
sudo npm install
sudo npm run build

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# Copiar configuración de Nginx
echo "🌐 Configurando Nginx..."
sudo cp $APP_DIR/nginx.conf /etc/nginx/conf.d/firma-glpi.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# Configurar permisos
echo "🔐 Configurando permisos..."
sudo chown -R $USER:$USER $APP_DIR
sudo chmod +x $APP_DIR/backend/index.js

# Copiar archivo de configuración de producción
echo "📝 Configurando variables de entorno..."
if [ ! -f "$APP_DIR/.env" ]; then
    sudo cp $APP_DIR/.env.production $APP_DIR/.env
    echo "⚠️  Recuerda editar $APP_DIR/.env con las credenciales correctas"
fi

# Iniciar aplicación con PM2
echo "🚀 Iniciando aplicación..."
cd $APP_DIR
sudo -u $USER pm2 start ecosystem.config.json
sudo -u $USER pm2 save
sudo -u $USER pm2 startup

# Configurar PM2 para autostart
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

echo "✅ Despliegue completado!"
echo "🌐 La aplicación está disponible en: http://$(curl -s ifconfig.me)"
echo "📊 Monitoreo: pm2 monit"
echo "📝 Logs: pm2 logs firma-glpi-backend"
