import React, { useEffect, useState } from 'react';
import styles from './AdminDashboard.module.css';
import MobileContainer from './MobileContainer';
import SignaturePadSmall from './SignaturePadSmall';
import { apiRequest } from '../config/api';

function AdminDashboard({ user, onLogout, token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingFirmaId, setEditingFirmaId] = useState(null);
  const [firmaTemp, setFirmaTemp] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest('/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Verificar si la respuesta es HTML (error común)
        const contentType = res.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          const htmlText = await res.text();
          console.error('❌ Respuesta no es JSON:', htmlText.substring(0, 200));
          throw new Error('El servidor devolvió HTML en lugar de JSON. Revisa la consola del navegador para más detalles.');
        }
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al cargar usuarios');
        setUsers(data);
      } catch (err) {
        console.error('❌ Error cargando usuarios:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const handleSaveFirma = async (userId) => {
    if (!firmaTemp) {
      setError('Dibuja una firma primero');
      return;
    }
    
    try {
      setError('');
      const res = await apiRequest(`/firma/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ signature_base64: firmaTemp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar firma');
      
      // Actualizar el usuario específico en el estado local sin refrescar toda la lista
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, signature_base64: firmaTemp }
            : user
        )
      );
      
      // Limpiar estado de edición
      setEditingFirmaId(null);
      setFirmaTemp('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: 'tecnico' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear usuario');
      setShowAddUser(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      // Refrescar usuarios
      const resUsers = await apiRequest('/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(await resUsers.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      setError('');
      const res = await apiRequest(`/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar usuario');
      // Refrescar usuarios
      const resUsers = await apiRequest('/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(await resUsers.json());
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancelar edición de firma
  const handleCancelFirma = () => {
    setEditingFirmaId(null);
    setFirmaTemp('');
  };

  // Iniciar edición de firma
  const handleStartEditFirma = (userId) => {
    setEditingFirmaId(userId);
    setFirmaTemp('');
  };

  return (
    <MobileContainer>
      <header className={styles.header}>
        <div>Panel Administrador</div>
        <button onClick={onLogout}>Salir</button>
      </header>
      <h2>Usuarios técnicos</h2>
      <button className={styles.addUserBtn} onClick={() => setShowAddUser(true)}>Agregar técnico</button>
      {showAddUser && (
        <form className={styles.addUserForm} onSubmit={handleAddUser}>
          <input type="text" placeholder="Nombre" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
          <input type="email" placeholder="Correo" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
          <button type="submit" className={styles.saveBtn}>Guardar</button>
          <button type="button" className={styles.cancelBtn} onClick={() => setShowAddUser(false)}>Cancelar</button>
        </form>
      )}
      {error && <div className={styles.error}>{error}</div>}
      {loading ? <div>Cargando...</div> : (
        <ul className={styles.userList}>
          {users.filter(u => u.role === 'tecnico').map(u => (
            <li key={`user-${u.id}`} className={styles.userItem}>
              <div><b>{u.name}</b> <span>({u.email})</span></div>
              <div className={styles.firmaSection}>
                <span>Firma: </span>
                {editingFirmaId === u.id ? (
                  <div className={styles.firmaEditor}>
                    <SignaturePadSmall 
                      key={`signature-${u.id}`}
                      value={firmaTemp} 
                      onChange={setFirmaTemp} 
                    />
                    <div className={styles.firmaActions}>
                      <button onClick={() => handleSaveFirma(u.id)} className={styles.saveBtn}>Guardar</button>
                      <button onClick={handleCancelFirma} className={styles.cancelBtn}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.firmaDisplay}>
                    {u.signature_base64 ? (
                      <img src={`data:image/png;base64,${u.signature_base64}`} alt="firma" className={styles.firmaPreview} />
                    ) : (
                      <span>No asignada</span>
                    )}
                    <button onClick={() => handleStartEditFirma(u.id)} className={styles.editBtn}>
                      {u.signature_base64 ? 'Reemplazar' : 'Asignar'}
                    </button>
                  </div>
                )}
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDeleteUser(u.id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}
      {/* Aquí se puede agregar gestión de firmas y usuarios en el futuro */}
    </MobileContainer>
  );
}

export default AdminDashboard;
