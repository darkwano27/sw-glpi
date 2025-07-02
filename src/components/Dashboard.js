import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import SignaturePad from './SignaturePad';
import MobileContainer from './MobileContainer';
import { apiRequest } from '../config/api';

function Dashboard({ user, onLogout }) {
  const [search, setSearch] = useState('');
  const [activos, setActivos] = useState([]);
  const [glpiUser, setGlpiUser] = useState(null);
  const [firma, setFirma] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mostrar preview de la firma del técnico si existe
  const [firmaTecnico, setFirmaTecnico] = useState('');
  useEffect(() => {
    // Obtener firma del técnico al cargar activos
    const fetchFirma = async () => {
      if (user && user.id) {
        try {
          const res = await apiRequest(`/firma/${user.id}`);
          const data = await res.json();
          if (res.ok && data.signature_base64) setFirmaTecnico(data.signature_base64);
          else setFirmaTecnico('');
        } catch {
          setFirmaTecnico('');
        }
      }
    };
    fetchFirma();
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setActivos([]);
    setGlpiUser(null);
    try {
      const res = await apiRequest(`/activos?search=${encodeURIComponent(search)}`);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error consultando activos');
      setActivos(data.activos);
      setGlpiUser(data.user);
      setEmail(data.user.email || '');
    } catch (err) {
      console.error('❌ Error en búsqueda:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      <header className={styles.header}>
        <div>Bienvenido, {user.name}</div>
        <button onClick={onLogout}>Salir</button>
      </header>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscar usuario GLPI (nombre/email)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Buscar</button>
      </form>
      {error && <div className={styles.error}>{error}</div>}
      {glpiUser && (
        <div className={styles.userInfo}>
          <div><b>Usuario GLPI:</b> {glpiUser.realname || glpiUser.name}</div>
          <div><b>Email:</b> {glpiUser.email || 'No tiene'}</div>
        </div>
      )}
      {activos.length > 0 && (
        <div className={styles.activosSection}>
          <h3>Activos asignados</h3>
          <ul className={styles.activosList}>
            {activos.map(a => (
              <li key={a.id}>
                <b>{a.name}</b> <span>({a.otherserial || 'Sin serial'})</span>
                <div className={styles.comentario}>{a.comment}</div>
              </li>
            ))}
          </ul>
          <div className={styles.firmaSection}>
            <h4>Firma del usuario (opcional)</h4>
            <SignaturePad value={firma} onChange={setFirma} />
          </div>
          <div className={styles.emailSection}>
            <label>Correo para envío (opcional):</label>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={async () => {
              if (!glpiUser) return setError('Primero busca un usuario GLPI');
              try {
                setError('');
                const res = await apiRequest('/pdf', {
                  method: 'POST',
                  body: JSON.stringify({
                    userId: user.id,
                    glpiSearch: search,
                    firmaUsuario: firma
                  })
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.message || 'Error generando PDF');
                }
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'activos.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                setError(err.message);
              }
            }}>Descargar PDF</button>
            <button type="button" onClick={async () => {
              if (!glpiUser) return setError('Primero busca un usuario GLPI');
              try {
                setError('');
                const res = await apiRequest('/email/send-pdf', {
                  method: 'POST',
                  body: JSON.stringify({
                    userId: user.id,
                    glpiSearch: search,
                    firmaUsuario: firma,
                    email: email || undefined
                  })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Error enviando PDF');
                alert('PDF enviado correctamente a ' + data.destinatario);
              } catch (err) {
                setError(err.message);
              }
            }}>Enviar PDF</button>
          </div>
          {firmaTecnico && (
            <div className={styles.firmaPreviewBox}>
              <div>Tu firma registrada:</div>
              <img src={`data:image/png;base64,${firmaTecnico}`} alt="Firma técnico" className={styles.firmaPreview} />
            </div>
          )}
        </div>
      )}
    </MobileContainer>
  );
}

export default Dashboard;
