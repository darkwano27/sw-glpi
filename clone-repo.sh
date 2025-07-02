#!/bin/bash

# Script para clonar específicamente la rama gpt-branch
echo "📥 Clonando repositorio SW-GLPI rama gpt-branch..."

# Variables
REPO_URL="https://github.com/darkwano27/sw-glpi.git"
BRANCH="gpt-branch"
APP_DIR="/opt/sw-glpi"

# Ir al directorio /opt
cd /opt

# Clonar solo la rama específica
echo "🔄 Clonando rama $BRANCH..."
sudo git clone -b $BRANCH --single-branch $REPO_URL

# Cambiar propietario
echo "👤 Cambiando permisos..."
sudo chown -R $USER:$USER $APP_DIR

# Entrar al directorio
cd $APP_DIR

echo "✅ Repositorio clonado exitosamente!"
echo "📂 Ubicación: $APP_DIR"
echo "🌿 Rama: $BRANCH"
echo "📋 Archivos disponibles:"
ls -la

echo ""
echo "🚀 Próximos pasos:"
echo "1. cd $APP_DIR"
echo "2. Ejecutar: sudo ./deploy.sh"
