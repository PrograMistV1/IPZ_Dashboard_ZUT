import { apiFetch } from './api';

export async function listUsers() {
  return apiFetch('/users');
}

export async function createUser(payload) {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateUser(id, payload) {
  return apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function disableUser(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

export async function listLogs(params = {}) {
  const qp = new URLSearchParams(params).toString();
  return apiFetch(`/logs${qp ? '?' + qp : ''}`);
}

export async function listLoginHistoryAll(params = {}) {
  const qp = new URLSearchParams(params).toString();
  return apiFetch(`/auth/login-history/all${qp ? '?' + qp : ''}`);
}
