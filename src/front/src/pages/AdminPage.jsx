import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { listUsers, createUser, updateUser, disableUser, listLogs } from '../services/admin';

function UsersTable({ onEdit, currentUserId }) {
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input placeholder="Search username" value={qUser} onChange={e => setQUser(e.target.value)} />
        <input placeholder="Search email" value={qEmail} onChange={e => setQEmail(e.target.value)} />
        <button onClick={load}>Refresh</button>
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
        {!initial?.id && (
          <>
            <label>Username<input value={username} onChange={e => setUsername(e.target.value)} required /></label>
            <label>Email<input value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
          </>
        )}
        <label>Role
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} /> Enabled
        </label>
        <div style={{ marginTop: 8 }}>
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
          <tr><th>Id</th><th>User</th><th>Action</th><th>Timestamp</th></tr>
        </thead>
        <tbody>
          {logs.map(entry => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>{entry.user_id}</td>
              <td>{entry.action}</td>
              <td>{entry.timestamp}</td>
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
        {!showLogs && <button onClick={() => setShowCreate(true)}>Create User</button>}
      </div>

      {!showLogs && (
        <UsersTable key={reloadKey} currentUserId={user.id} onEdit={(u) => setEditing(u)} />
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
