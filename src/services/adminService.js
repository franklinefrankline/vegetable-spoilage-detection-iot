/**
 * VegSense Enterprise Admin API Service
 * Secure, authenticated client for communicating with /api/admin backend endpoints.
 * Part 11: Main Admin + Admin Management + Permissions + Devices + Audit Logs
 */

const TOKEN_KEY = 'veg_storage_auth_token';

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Admin API request failed.');
    error.status = response.status;
    error.code = data?.error || data?.code || 'ADMIN_API_ERROR';
    error.data = data;
    throw error;
  }

  return data;
}

export const adminService = {
  /**
   * Fetch aggregated statistics, registration trend, and recent activity
   */
  async getDashboardStats() {
    return request('/api/admin/dashboard');
  },

  /**
   * Fetch system-wide telemetry and record counts
   */
  async getStats() {
    return request('/api/admin/stats');
  },

  /**
   * Fetch paginated and filtered user list
   * @param {Object} params { search, role, status, sort, page, limit }
   */
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'ALL') query.append('role', params.role);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    return request(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch detailed record of single user including device/batch counts
   */
  async getUser(id) {
    return request(`/api/admin/users/${id}`);
  },

  /**
   * Update user account profile, role, or active status
   */
  async updateUser(id, payload) {
    return request(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Activate user account
   */
  async activateUser(id) {
    return request(`/api/admin/users/${id}/activate`, {
      method: 'PATCH'
    });
  },

  /**
   * Deactivate user account
   */
  async deactivateUser(id) {
    return request(`/api/admin/users/${id}/deactivate`, {
      method: 'PATCH'
    });
  },

  /**
   * Update user role (USER <-> ADMIN)
   */
  async changeUserRole(id, role) {
    return request(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  /**
   * Permanently delete user account
   * @param {string} id User ID
   * @param {string} confirmation Must be "DELETE"
   */
  async deleteUser(id, confirmation = 'DELETE') {
    return request(`/api/admin/users/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirmation })
    });
  },

  /**
   * Bulk delete multiple user accounts
   * @param {string[]} userIds
   * @param {string} confirmation Must be "DELETE"
   */
  async bulkDeleteUsers(userIds, confirmation = 'DELETE') {
    return request('/api/admin/users/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds, confirmation })
    });
  },

  // ==========================================================================
  // ADMINISTRATOR MANAGEMENT (MAIN ADMIN)
  // ==========================================================================

  /**
   * List administrators with search and status filtering
   */
  async getAdmins(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);

    const queryString = query.toString();
    return request(`/api/admin/admins${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch specific administrator profile with permissions
   */
  async getAdmin(id) {
    return request(`/api/admin/admins/${id}`);
  },

  /**
   * Create a new administrator account (Main Admin only)
   * @param {Object} data { name, username, email, password, is_active, permissions }
   */
  async createAdmin(data) {
    return request('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Update administrator profile
   */
  async updateAdmin(id, data) {
    return request(`/api/admin/admins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  /**
   * Activate administrator
   */
  async activateAdmin(id) {
    return request(`/api/admin/admins/${id}/activate`, {
      method: 'PATCH'
    });
  },

  /**
   * Deactivate administrator (blocks login)
   */
  async deactivateAdmin(id) {
    return request(`/api/admin/admins/${id}/deactivate`, {
      method: 'PATCH'
    });
  },

  /**
   * Delete administrator permanently
   */
  async deleteAdmin(id, confirmation = 'DELETE') {
    return request(`/api/admin/admins/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirmation })
    });
  },

  /**
   * Get permissions for administrator
   */
  async getAdminPermissions(id) {
    return request(`/api/admin/admins/${id}/permissions`);
  },

  /**
   * Update permissions for administrator
   */
  async updateAdminPermissions(id, permissions) {
    return request(`/api/admin/admins/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(permissions)
    });
  },

  /**
   * Reset administrator password
   */
  async resetAdminPassword(id, password = null) {
    return request(`/api/admin/admins/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  },

  // ==========================================================================
  // SYSTEM AUDIT & HEALTH & DEVICES
  // ==========================================================================

  /**
   * Fetch administrative audit logs
   * @param {Object} params { search, action, page, limit }
   */
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.action && params.action !== 'ALL') query.append('action', params.action);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    return request(`/api/admin/audit-logs${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch system-wide hardware devices directory
   */
  async getDevices(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);

    const queryString = query.toString();
    return request(`/api/admin/devices${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch comprehensive system health status
   */
  async getSystemHealth() {
    return request('/api/admin/system');
  }
};

export default adminService;
