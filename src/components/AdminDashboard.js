import React, { useEffect, useState } from 'react';
import styles from './AdminDashboard.module.css';
import MobileContainer from './MobileContainer';
import SignaturePadSmall from './SignaturePadSmall';

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
        const res = await fetch('/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al cargar usuarios');
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const handleSaveFirma = async (userId) => {
    try {
      setError('');
      const res = await fetch(`/api/firma/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ signature_base64: firmaTemp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar firma');
      setEditingFirmaId(null);
      setFirmaTemp('');
      // Refrescar usuarios
      const resUsers = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(await resUsers.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await fetch('/api/auth/register', {
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
      const resUsers = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(await resUsers.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      setError('');
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar usuario');
      // Refrescar usuarios
      const resUsers = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(await resUsers.json());
    } catch (err) {
      setError(err.message);
    }
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
            <li key={u.id} className={styles.userItem}>
              <div><b>{u.name}</b> <span>({u.email})</span></div>
              <div>Firma: {editingFirmaId === u.id ? (
                <div>
                  <SignaturePadSmall value={firmaTemp} onChange={setFirmaTemp} />
                  <button onClick={() => handleSaveFirma(u.id)} className={styles.saveBtn}>Guardar</button>
                  <button onClick={() => { setEditingFirmaId(null); setFirmaTemp(''); }} className={styles.cancelBtn}>Cancelar</button>
                </div>
              ) : (
                u.signature_base64 ? <img src={`data:image/png;base64,${u.signature_base64}`} alt="firma" className={styles.firmaPreview} /> : 'No asignada'
              )}
                {editingFirmaId !== u.id && (
                  <button onClick={() => { setEditingFirmaId(u.id); setFirmaTemp(''); }} className={styles.editBtn}>Asignar/Reemplazar</button>
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
