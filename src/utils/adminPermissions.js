/**
 * VegSense Enterprise Admin Permissions & Security Utility
 * Part 11: Main Admin + Admin Management + Role-Based Access Control
 */

export const ADMIN_PERMISSIONS = {
  USER_MANAGEMENT: 'user_management',
  ADMIN_MANAGEMENT: 'admin_management',
  DEVICE_MANAGEMENT: 'device_management',
  STORAGE_MANAGEMENT: 'storage_management',
  SENSOR_MONITORING: 'sensor_monitoring',
  SPOILAGE_MONITORING: 'spoilage_monitoring',
  ALERT_MANAGEMENT: 'alert_management',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  SYSTEM_SETTINGS: 'system_settings',
  AUDIT_LOGS: 'audit_logs'
};

export const PERMISSION_LABELS = {
  user_management: 'User Management',
  admin_management: 'Admin Management',
  device_management: 'Device Management',
  storage_management: 'Storage Management',
  sensor_monitoring: 'Sensor Monitoring',
  spoilage_monitoring: 'Spoilage Monitoring',
  alert_management: 'Alert Management',
  analytics: 'Analytics',
  reports: 'Reports',
  system_settings: 'System Overview & Settings',
  audit_logs: 'Audit Logs'
};

/**
 * Check if user is the Main Administrator
 * @param {Object} user
 * @returns {boolean}
 */
export function isMainAdmin(user) {
  if (!user) return false;
  return String(user.role || '').toUpperCase() === 'MAIN_ADMIN';
}

/**
 * Check if a user has any Administrator role (MAIN_ADMIN or ADMIN)
 * @param {Object} user Current authenticated user
 * @returns {boolean}
 */
export function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  return role === 'ADMIN' || role === 'MAIN_ADMIN';
}

/**
 * Check if user can access the Admin Portal
 * @param {Object} user Current authenticated user
 * @returns {boolean}
 */
export function canAccessAdmin(user) {
  return isAdmin(user) && (user.is_active === 1 || user.is_active === undefined || user.is_active === true);
}

/**
 * Check if user has a specific administrative permission
 * @param {Object} user
 * @param {string} permissionKey
 * @returns {boolean}
 */
export function hasPermission(user, permissionKey) {
  if (!user) return false;
  if (isMainAdmin(user)) return true;
  if (!isAdmin(user)) return false;

  const perms = user.permissions || {};
  if (perms.full_access === 1 || perms.full_access === true) return true;

  return Boolean(perms[permissionKey] === 1 || perms[permissionKey] === true);
}

/**
 * Check if user can delete a target administrator
 * @param {Object} currentAdmin
 * @param {Object} targetAdmin
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canDeleteAdmin(currentAdmin, targetAdmin) {
  if (!currentAdmin || !targetAdmin) {
    return { allowed: false, reason: 'Invalid administrative parameters.' };
  }

  if (!isMainAdmin(currentAdmin)) {
    return { allowed: false, reason: 'Only the Main Administrator can delete administrator accounts.' };
  }

  if (isMainAdmin(targetAdmin)) {
    return { allowed: false, reason: 'The Main Administrator account is permanent and protected from deletion.' };
  }

  if (currentAdmin.id === targetAdmin.id) {
    return { allowed: false, reason: 'You cannot delete your own administrator account.' };
  }

  return { allowed: true };
}

/**
 * Check if user can deactivate a target administrator
 * @param {Object} currentAdmin
 * @param {Object} targetAdmin
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canDeactivateAdmin(currentAdmin, targetAdmin) {
  if (!currentAdmin || !targetAdmin) {
    return { allowed: false, reason: 'Invalid administrative parameters.' };
  }

  if (!isMainAdmin(currentAdmin)) {
    return { allowed: false, reason: 'Only the Main Administrator can deactivate administrator accounts.' };
  }

  if (isMainAdmin(targetAdmin)) {
    return { allowed: false, reason: 'The Main Administrator account is permanent and cannot be deactivated.' };
  }

  if (currentAdmin.id === targetAdmin.id) {
    return { allowed: false, reason: 'You cannot deactivate your own administrator account.' };
  }

  return { allowed: true };
}

/**
 * Check if user can delete a normal user
 * @param {Object} currentAdmin
 * @param {Object} targetUser
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canDeleteUser(currentAdmin, targetUser) {
  if (!currentAdmin || !targetUser) {
    return { allowed: false, reason: 'Invalid parameters.' };
  }

  if (isMainAdmin(targetUser)) {
    return { allowed: false, reason: 'The Main Administrator account cannot be deleted.' };
  }

  if (currentAdmin.id === targetUser.id) {
    return { allowed: false, reason: 'You cannot delete your own account through user management.' };
  }

  if (String(targetUser.role || '').toUpperCase() === 'ADMIN' && !isMainAdmin(currentAdmin)) {
    return { allowed: false, reason: 'Only the Main Administrator can delete another administrator.' };
  }

  if (!hasPermission(currentAdmin, 'user_management')) {
    return { allowed: false, reason: 'You do not have permission to manage users.' };
  }

  return { allowed: true };
}

/**
 * Check if user can deactivate a normal user
 * @param {Object} currentAdmin
 * @param {Object} targetUser
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canDeactivateUser(currentAdmin, targetUser) {
  if (!currentAdmin || !targetUser) {
    return { allowed: false, reason: 'Invalid parameters.' };
  }

  if (isMainAdmin(targetUser)) {
    return { allowed: false, reason: 'The Main Administrator account cannot be deactivated.' };
  }

  if (currentAdmin.id === targetUser.id) {
    return { allowed: false, reason: 'You cannot deactivate your own account.' };
  }

  if (String(targetUser.role || '').toUpperCase() === 'ADMIN' && !isMainAdmin(currentAdmin)) {
    return { allowed: false, reason: 'Only the Main Administrator can deactivate an administrator.' };
  }

  if (!hasPermission(currentAdmin, 'user_management')) {
    return { allowed: false, reason: 'You do not have permission to manage users.' };
  }

  return { allowed: true };
}

/**
 * Check if user can change roles
 * @param {Object} currentAdmin
 * @param {Object} targetUser
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canChangeRole(currentAdmin, targetUser) {
  if (!currentAdmin || !targetUser) {
    return { allowed: false, reason: 'Invalid parameters.' };
  }

  if (isMainAdmin(targetUser)) {
    return { allowed: false, reason: 'The Main Administrator role cannot be changed.' };
  }

  if (!isMainAdmin(currentAdmin)) {
    return { allowed: false, reason: 'Only the Main Administrator can change user roles.' };
  }

  return { allowed: true };
}
