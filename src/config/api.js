// src/config/api.js
// Configuración centralizada de la API

export const API_BASE_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:3001`;

// Utilidad para hacer peticiones a la API
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  // Solo verificar JSON si esperamos JSON (no para PDFs, imágenes, etc.)
  const contentType = response.headers.get('content-type');
  const expectsJson = !options.expectsBlob && !contentType?.includes('application/pdf');
  
  if (expectsJson && contentType && !contentType.includes('application/json')) {
    const htmlText = await response.text();
    console.error('❌ Respuesta no es JSON:', htmlText.substring(0, 200));
    throw new Error('El servidor devolvió HTML en lugar de JSON. Revisa la consola del navegador para más detalles.');
  }
  
  return response;
};
