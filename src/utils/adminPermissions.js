/**
 * VegSense Enterprise Admin Permissions & Security Utility
 */

/**
 * Check if a user has Administrator privileges
 * @param {Object} user Current authenticated user
 * @returns {boolean}
 */
export function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  return role === 'ADMIN';
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
 * Check if the admin can delete the target user
 * @param {Object} currentAdmin Current logged in admin
 * @param {Object} targetUser Target user to delete
 * @param {number} activeAdminCount Number of total active administrators
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canDeleteUser(currentAdmin, targetUser, activeAdminCount = 2) {
  if (!currentAdmin || !targetUser) {
    return { allowed: false, reason: 'Invalid parameters.' };
  }

  // Section 20: Self-deletion protection
  if (currentAdmin.id === targetUser.id) {
    return { allowed: false, reason: 'You cannot delete your own administrator account.' };
  }

  // Section 21: Last-admin protection
  if (String(targetUser.role || '').toUpperCase() === 'ADMIN' && activeAdminCount <= 1) {
    return { allowed: false, reason: 'At least one active administrator must remain.' };
  }

  return { allowed: true };
}

/**
 * Check if the admin can deactivate the target user
 * @param {Object} currentAdmin Current logged in admin
 * @param {Object} targetUser Target user to deactivate
 * @param {number} activeAdminCount Number of total active administrators
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canDeactivateUser(currentAdmin, targetUser, activeAdminCount = 2) {
  if (!currentAdmin || !targetUser) {
    return { allowed: false, reason: 'Invalid parameters.' };
  }

  if (currentAdmin.id === targetUser.id) {
    return { allowed: false, reason: 'You cannot deactivate your own administrator account.' };
  }

  if (String(targetUser.role || '').toUpperCase() === 'ADMIN' && activeAdminCount <= 1) {
    return { allowed: false, reason: 'At least one active administrator must remain.' };
  }

  return { allowed: true };
}

/**
 * Check if the admin can demote the target user to USER
 * @param {Object} currentAdmin Current logged in admin
 * @param {Object} targetUser Target user
 * @param {number} activeAdminCount Number of total active administrators
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canChangeRole(currentAdmin, targetUser, activeAdminCount = 2) {
  if (!currentAdmin || !targetUser) {
    return { allowed: false, reason: 'Invalid parameters.' };
  }

  if (currentAdmin.id === targetUser.id && activeAdminCount <= 1) {
    return { allowed: false, reason: 'You cannot demote yourself while being the last administrator.' };
  }

  if (String(targetUser.role || '').toUpperCase() === 'ADMIN' && activeAdminCount <= 1) {
    return { allowed: false, reason: 'At least one active administrator must remain.' };
  }

  return { allowed: true };
}
