import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = async ({ email, password }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error de autenticación');
      }
      
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error('No se puede conectar con el servidor');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user
            ? user.role === 'admin'
              ? <AdminDashboard user={user} onLogout={handleLogout} token={token} />
              : <Dashboard user={user} onLogout={handleLogout} token={token} />
            : <Login onLogin={handleLogin} />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
