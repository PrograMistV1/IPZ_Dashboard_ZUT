import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { listUsers, createUser, updateUser, disableUser, listLogs } from '../services/admin';
import '../styles/admin.css';

function UsersTable({ onEdit, currentUserId, onCreate }) {
  const [users, setUsers] = useState([]);
  const [qUser, setQUser] = useState('');
  const [qEmail, setQEmail] = useState('');
  

  const load = async () => {
    const data = await listUsers();
    setUsers(data || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter(u => {
    return (!qUser || u.username.toLowerCase().includes(qUser.toLowerCase())) && (!qEmail || u.email.toLowerCase().includes(qEmail.toLowerCase()));
  }), [users, qUser, qEmail]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="search-group">
          <input type="text" placeholder="Search username" value={qUser} onChange={e => setQUser(e.target.value)} />
          <input type="text" placeholder="Search email" value={qEmail} onChange={e => setQEmail(e.target.value)} />
          <button className="icon-btn" onClick={load} aria-label="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49 21.49 20 15.5 14zM9.5 14A4.5 4.5 0 119.5 5a4.5 4.5 0 010 9z" fill="#1557a3" />
            </svg>
          </button>
        </div>
        <div>
          {onCreate && <button onClick={onCreate}>Create User</button>}
        </div>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>Id</th><th>Username</th><th>Email</th><th>Role</th><th>Enabled</th></tr>
        </thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}{u.id === currentUserId && ' (you)'}</td>
              <td>{u.email}</td>
              <td>
                <select disabled={u.id === currentUserId} value={u.role} onChange={async e => {
                  if (u.id === currentUserId) return;
                  try {
                    await updateUser(u.id, { role: e.target.value });
                    await load();
                  } catch (err) {
                    alert('Update failed: ' + err.message);
                  }
                }}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td>
                <input disabled={u.id === currentUserId} type="checkbox" checked={u.isEnabled} onChange={async e => {
                  if (u.id === currentUserId) return;
                  try {
                    await updateUser(u.id, { isEnabled: e.target.checked });
                    await load();
                  } catch (err) {
                    alert('Update failed: ' + err.message);
                  }
                }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserForm({ initial, onClose, onSaved }) {
  const [username, setUsername] = useState(initial?.username || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initial?.role || 'USER');
  const [isEnabled, setIsEnabled] = useState(initial?.isEnabled ?? true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initial?.id) {
        await updateUser(initial.id, { role, isEnabled });
      } else {
        await createUser({ username, email, password, role, isEnabled });
      }
      onSaved && onSaved();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  return (
    <div className="modal">
      <form className="modal-content" onSubmit={handleSubmit}>
        <h3>{initial?.id ? 'Edit user' : 'Create user'}</h3>
        <div className="form-grid">
        {!initial?.id && (
          <>
            <label>Username
              <input className="field" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </label>
            <label>Email
              <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label>Password
              <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
          </>
        )}
        <label>Role
          <select className="field" value={role} onChange={e => setRole(e.target.value)}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} /> Enabled
        </label>
        </div>
        <div className="actions">
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function LogsTable() {
  const [logs, setLogs] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    const params = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const data = await listLogs(params);
    setLogs(data || []);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="datetime-local" placeholder="dateFrom (ISO)" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="datetime-local" placeholder="dateTo (ISO)" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button onClick={load}>Filter</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>Id</th><th>User</th><th>Action</th><th>Time</th></tr>
        </thead>
        <tbody>
          {logs.map(entry => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>{entry.user_id}</td>
              <td>{entry.action}</td>
              <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [showLogs, setShowLogs] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!user || user.role !== 'ADMIN') return <div>Access denied</div>;

  return (
    <div className="admin-page">
      <h2>Admin Panel</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setShowLogs(false)}>Users</button>
        <button onClick={() => setShowLogs(true)}>Logs</button>
      </div>

      {!showLogs && (
        <UsersTable key={reloadKey} currentUserId={user.id} onEdit={(u) => setEditing(u)} onCreate={() => setShowCreate(true)} />
      )}

      {showLogs && <LogsTable />}

      {showCreate && (
        <UserForm initial={null} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); setReloadKey(k => k+1); }} />
      )}

      {editing && (
        <UserForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setReloadKey(k => k+1); }} />
      )}
    </div>
  );
}
