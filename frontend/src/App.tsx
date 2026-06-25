import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: { permission: { resource: string; action: string; label: string } }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  role: { name: string };
  roleId: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  emoji: string;
}

const API = 'http://localhost:3000';

// Avatar color palette
const AVATAR_COLORS = [
  '#8b5cf6','#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6',
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Toast Hook ───────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    const emoji = type === 'success' ? '✅' : '❌';
    setToasts(prev => [...prev, { id, message, type, emoji }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
interface EditUserModalProps {
  user: User;
  roles: Role[];
  activeRole: string;
  canAssignRole: boolean;
  canEditIdentity: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onError: (msg: string) => void;
}

function EditUserModal({ user, roles, activeRole, canAssignRole, canEditIdentity, onClose, onSuccess, onError }: EditUserModalProps) {
  const [form, setForm] = useState({
    name:       user.name,
    email:      user.email,
    department: user.department,
    position:   user.position,
    roleId:     String(user.roleId),
    status:     user.status,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.put(`${API}/api/users/${user.id}`, form, {
        headers: { 'x-actor-role': activeRole },
      });
      onSuccess(res.data);
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.name && form.email && form.department && form.position && form.roleId && form.status;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">✏️ Edit User</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">
                  Full Name
                  {!canEditIdentity && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>
                      🔒 no permission
                    </span>
                  )}
                </label>
                <input
                  id="edit-input-name"
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={!canEditIdentity}
                  title={!canEditIdentity ? 'Your role cannot edit name or email' : undefined}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Email
                  {!canEditIdentity && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>
                      🔒 no permission
                    </span>
                  )}
                </label>
                <input
                  id="edit-input-email"
                  className="form-input"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={!canEditIdentity}
                  title={!canEditIdentity ? 'Your role cannot edit name or email' : undefined}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Department</label>
                <input id="edit-input-department" className="form-input" name="department" value={form.department} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label className="form-label">Position</label>
                <input id="edit-input-position" className="form-input" name="position" value={form.position} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">
                  Role
                  {!canAssignRole && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>
                      🔒 no permission
                    </span>
                  )}
                </label>
                <select
                  id="edit-input-role"
                  className="form-select"
                  name="roleId"
                  value={form.roleId}
                  onChange={handleChange}
                  disabled={!canAssignRole}
                  title={!canAssignRole ? 'Your role does not have permission to change user roles' : undefined}
                  required
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select id="edit-input-status" className="form-select" name="status" value={form.status} onChange={handleChange} required>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="btn-submit-edit" type="submit" className="btn btn-primary" disabled={!isValid || submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────
interface AddUserModalProps {
  roles: Role[];
  activeRole: string;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onError: (msg: string) => void;
}

function AddUserModal({ roles, activeRole, onClose, onSuccess, onError }: AddUserModalProps) {
  const [form, setForm] = useState({ name: '', email: '', department: '', position: '', roleId: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/users`, form, {
        headers: { 'x-actor-role': activeRole },
      });
      onSuccess(res.data);
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.name && form.email && form.department && form.position && form.roleId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">➕ Add New User</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input id="input-name" className="form-input" name="name" placeholder="Alice Tan" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input id="input-email" className="form-input" name="email" type="email" placeholder="alice@example.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Department</label>
                <input id="input-department" className="form-input" name="department" placeholder="Engineering" value={form.department} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label className="form-label">Position</label>
                <input id="input-position" className="form-input" name="position" placeholder="Developer" value={form.position} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Assign Role</label>
              <select id="input-role" className="form-select" name="roleId" value={form.roleId} onChange={handleChange} required>
                <option value="">Select a role…</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="btn-submit-user" type="submit" className="btn btn-primary" disabled={!isValid || submitting}>
              {submitting ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const ROLES_LIST = ['Admin', 'Manager', 'Viewer', 'Hacker'];

export default function App() {
  const [activeRole, setActiveRole] = useState('Admin');
  const [activeTab, setActiveTab]   = useState<'users' | 'roles'>('users');
  const [users, setUsers]           = useState<User[]>([]);
  const [roles, setRoles]           = useState<Role[]>([]);
  const [usersError, setUsersError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole,   setFilterRole]   = useState('');
  const [filterDept,   setFilterDept]   = useState('');
  const { toasts, addToast } = useToasts();

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const res = await axios.get(`${API}/api/users`, {
        headers: { 'x-actor-role': activeRole },
      });
      setUsers(res.data);
    } catch (err: any) {
      setUsersError(err.response?.data?.error || 'Failed to fetch users.');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [activeRole]);

  // ── Fetch roles ────────────────────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res = await axios.get(`${API}/api/roles`, {
        headers: { 'x-actor-role': activeRole },
      });
      setRoles(res.data);
    } catch {
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, [activeRole]);

  useEffect(() => { fetchUsers(); fetchRoles(); }, [fetchUsers, fetchRoles]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalActive   = users.filter(u => u.status === 'ACTIVE').length;
  const totalInactive = users.filter(u => u.status === 'INACTIVE').length;
  const totalPending  = users.filter(u => u.status === 'PENDING').length;

  // ── Filtered users ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.position.toLowerCase().includes(q);
    const matchStatus = !filterStatus || u.status === filterStatus;
    const matchRole   = !filterRole   || u.role.name === filterRole;
    const matchDept   = !filterDept   || u.department === filterDept;
    return matchSearch && matchStatus && matchRole && matchDept;
  });

  const handleUserUpdated = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setEditingUser(null);
    addToast(`"${updated.name}" updated successfully.`, 'success');
  };

  const handleDeactivate = async (user: User) => {
    if (!window.confirm(`Deactivate "${user.name}"? Their status will be set to Inactive.`)) return;
    try {
      const res = await axios.patch(`${API}/api/users/${user.id}/deactivate`, {}, {
        headers: { 'x-actor-role': activeRole },
      });
      setUsers(prev => prev.map(u => u.id === res.data.id ? res.data : u));
      addToast(`"${user.name}" has been deactivated.`, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to deactivate user.', 'error');
    }
  };

  const handleReactivate = async (user: User) => {
    if (!window.confirm(`Reactivate "${user.name}"? Their status will be set to Active.`)) return;
    try {
      const res = await axios.patch(`${API}/api/users/${user.id}/reactivate`, {}, {
        headers: { 'x-actor-role': activeRole },
      });
      setUsers(prev => prev.map(u => u.id === res.data.id ? res.data : u));
      addToast(`"${user.name}" has been reactivated.`, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to reactivate user.', 'error');
    }
  };

  const handleUserCreated = (user: User) => {
    setUsers(prev => [...prev, user]);
    setShowModal(false);
    addToast(`User "${user.name}" created successfully.`, 'success');
  };

  const handleCreateError = (msg: string) => {
    addToast(msg, 'error');
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'ACTIVE')   return 'badge badge-active';
    if (status === 'INACTIVE') return 'badge badge-inactive';
    return 'badge badge-pending';
  };

  const uniqueRoleNames = [...new Set(users.map(u => u.role.name))];
  const uniqueDeptNames = [...new Set(users.map(u => u.department))].sort();

  // Derive what the active actor is allowed to do, based on their role's DB permissions
  const activeRoleData = roles.find(r => r.name === activeRole);
  const hasPermission  = (resource: string, action: string) =>
    activeRoleData?.permissions.some(rp =>
      rp.permission.resource === resource && rp.permission.action === action
    ) ?? false;
  const canCreate        = hasPermission('user', 'create');
  const canAssignRole    = hasPermission('role', 'assign');
  const canEditIdentity  = hasPermission('user', 'update-identity');
  const canDeactivate    = hasPermission('user', 'deactivate');
  // Determine if the current actor can edit users
  const canEdit = !usersError && roles.length > 0 && hasPermission('user', 'update');

  return (
    <div className="app-layout">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">🔐</div>
          <div>
            <div className="header-title">UserFlow</div>
            <div className="header-subtitle">Access Management</div>
          </div>
        </div>
        <div className="header-right">
          <div className="role-switcher">
            <label htmlFor="role-switcher-select">Simulating as:</label>
            <select
              id="role-switcher-select"
              className="role-select"
              value={activeRole}
              onChange={e => { setActiveRole(e.target.value); setSearch(''); setFilterStatus(''); setFilterRole(''); setFilterDept(''); }}
            >
              {ROLES_LIST.map(r => (
                <option key={r} value={r}>{r === 'Hacker' ? '⚠️ Hacker (403 test)' : r}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="main-content">
        {/* Page header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1>User Management</h1>
            <p>Manage team members and access permissions across your organisation.</p>
          </div>
          {activeTab === 'users' && canCreate && (
            <button
              id="btn-add-user"
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              disabled={loadingUsers || !!usersError}
              title="Add a new user"
            >
              ＋ Add User
            </button>
          )}
        </div>

        {/* Stats */}
        {!usersError && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{users.length}</div>
              <div className="stat-chip purple">👥 All members</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active</div>
              <div className="stat-value">{totalActive}</div>
              <div className="stat-chip green">● Online</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{totalPending}</div>
              <div className="stat-chip orange">◐ Awaiting</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Inactive</div>
              <div className="stat-value">{totalInactive}</div>
              <div className="stat-chip red">○ Offline</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Roles</div>
              <div className="stat-value">{roles.length}</div>
              <div className="stat-chip purple">🔑 Defined</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            id="tab-users"
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👤 Users
          </button>
          <button
            id="tab-roles"
            className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            🔑 Roles & Permissions
          </button>
        </div>

        {/* ── Users Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <>
            {/* Permission error */}
            {usersError && (
              <div className="permission-alert">
                <span className="permission-alert-icon">🚫</span>
                <div className="permission-alert-text">
                  <strong>Access Denied</strong><br />{usersError}<br />
                  <span style={{ opacity: 0.7 }}>Switch your simulated role above to gain access.</span>
                </div>
              </div>
            )}

            {/* Toolbar */}
            {!usersError && (
              <div className="toolbar">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    id="search-users"
                    className="search-input"
                    placeholder="Search by name, email, dept or position…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    id="filter-status"
                    className="filter-select"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <select
                    id="filter-role"
                    className="filter-select"
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    {uniqueRoleNames.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select
                    id="filter-dept"
                    className="filter-select"
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {uniqueDeptNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {(search || filterStatus || filterRole || filterDept) && (
                    <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilterStatus(''); setFilterRole(''); setFilterDept(''); }}>
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Table */}
            {!usersError && (
              <div className="table-wrapper">
                {loadingUsers ? (
                  <div className="state-box">
                    <div className="spinner"></div>
                    <p className="state-desc">Fetching users…</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="state-box">
                    <div className="state-icon">🔍</div>
                    <p className="state-title">No users found</p>
                    <p className="state-desc">Try adjusting your search filters or add a new user.</p>
                  </div>
                ) : (
                  <>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Member</th>
                          <th>Department</th>
                          <th>Position</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id}>
                            <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', width: 40 }}>
                              {user.id}
                            </td>
                            <td>
                              <div className="user-cell">
                                <div
                                  className="user-avatar"
                                  style={{ background: avatarColor(user.name) }}
                                >
                                  {initials(user.name)}
                                </div>
                                <div>
                                  <div className="user-name">{user.name}</div>
                                  <div className="user-email">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{user.department}</td>
                            <td>{user.position}</td>
                            <td><span className="role-badge">{user.role.name}</span></td>
                            <td>
                              <span className={statusBadgeClass(user.status)}>
                                <span className="badge-dot"></span>
                                {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                              </span>
                            </td>
                            <td style={{ width: 88, textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                {canEdit && (
                                  <button
                                    id={`btn-edit-user-${user.id}`}
                                    className="btn-icon"
                                    title="Edit user"
                                    onClick={() => setEditingUser(user)}
                                  >
                                    ✏️
                                  </button>
                                )}
                                {canDeactivate && (
                                  user.status === 'INACTIVE' ? (
                                    <button
                                      id={`btn-reactivate-user-${user.id}`}
                                      className="btn-icon btn-icon-success"
                                      title="Reactivate user"
                                      onClick={() => handleReactivate(user)}
                                    >
                                      ✅
                                    </button>
                                  ) : (
                                    <button
                                      id={`btn-deactivate-user-${user.id}`}
                                      className="btn-icon btn-icon-danger"
                                      title="Deactivate user"
                                      onClick={() => handleDeactivate(user)}
                                    >
                                      🚫
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="table-footer">
                      Showing {filteredUsers.length} of {users.length} users
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Roles Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'roles' && (
          <>
            {loadingRoles ? (
              <div className="state-box">
                <div className="spinner"></div>
                <p className="state-desc">Loading roles…</p>
              </div>
            ) : roles.length === 0 ? (
              <div className="state-box">
                <div className="state-icon">🔑</div>
                <p className="state-title">No roles found</p>
                <p className="state-desc">Could not load roles. Check the backend is running.</p>
              </div>
            ) : (
              <div className="roles-grid">
                {roles.map(role => (
                  <div className="role-card" key={role.id}>
                    <div className="role-card-header">
                      <div className="role-card-title">{role.name}</div>
                      {role.isSystem && <span className="role-system-badge">System</span>}
                    </div>
                    <p className="role-card-desc">{role.description}</p>
                    <div className="permissions-list">
                      {role.permissions.map(rp => (
                        <span
                          key={`${rp.permission.resource}:${rp.permission.action}`}
                          className="perm-chip"
                        >
                          {rp.permission.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          roles={roles}
          activeRole={activeRole}
          canAssignRole={canAssignRole}
          canEditIdentity={canEditIdentity}
          onClose={() => setEditingUser(null)}
          onSuccess={handleUserUpdated}
          onError={handleCreateError}
        />
      )}

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <AddUserModal
          roles={roles}
          activeRole={activeRole}
          onClose={() => setShowModal(false)}
          onSuccess={handleUserCreated}
          onError={handleCreateError}
        />
      )}

      {/* ── Toast Notifications ────────────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-emoji">{t.emoji}</span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}