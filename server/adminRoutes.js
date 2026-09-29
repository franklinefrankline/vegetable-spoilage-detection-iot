import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import db, {
  savePersistentUser,
  deletePersistentUser,
  updatePersistentUserMeta,
  updatePersistentPassword,
  recordAuditLog,
  syncPersistentUsers,
  ensureAdminPermissions
} from './db.js';
import { requireAdmin, requireMainAdmin, requirePermission } from './authRoutes.js';

const router = express.Router();

// All admin routes strictly require authenticated ADMIN or MAIN_ADMIN role
router.use(requireAdmin);

// Helper to count active administrators
function getActiveAdminCount() {
  const row = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('ADMIN', 'MAIN_ADMIN') AND is_active = 1").get();
  return row?.count || 0;
}

// ============================================================================
// 1. GET /api/admin/dashboard - Enterprise Summary Statistics & Activity
// ============================================================================
router.get('/dashboard', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'USER'").get().count;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'USER' AND is_active = 1").get().count;
    const inactiveUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'USER' AND is_active = 0").get().count;
    const totalAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('ADMIN', 'MAIN_ADMIN')").get().count;
    const activeAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('ADMIN', 'MAIN_ADMIN') AND is_active = 1").get().count;
    const administrators = totalAdmins;

    const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const onlineDevices = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'connected' AND (is_active = 1 OR is_active IS NULL)").get().count;
    const offlineDevices = Math.max(0, totalDevices - onlineDevices);

    // Dynamic date calculations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString();
    const oneYearAgo = new Date(now.getTime() - 365 * 86400000).toISOString();

    const newUsersToday = db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').get(startOfToday).count;
    const newUsersThisWeek = db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').get(sevenDaysAgo).count;
    const newUsersThisMonth = db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').get(thirtyDaysAgo).count;

    // Trend grouping: Group real database created_at dates
    const allUserDates = db.prepare('SELECT created_at FROM users ORDER BY created_at ASC').all();
    
    // Generate buckets for 7d, 30d, 90d, 1y
    const buildTrend = (sinceDate, daysCount) => {
      const buckets = {};
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      for (const u of allUserDates) {
        if (u.created_at) {
          const k = u.created_at.slice(0, 10);
          if (buckets[k] !== undefined) {
            buckets[k]++;
          }
        }
      }
      return Object.entries(buckets).map(([date, count]) => ({ date, count }));
    };

    const registrationTrend = {
      '7d': buildTrend(sevenDaysAgo, 7),
      '30d': buildTrend(thirtyDaysAgo, 30),
      '90d': buildTrend(ninetyDaysAgo, 90),
      '1y': buildTrend(oneYearAgo, 12)
    };

    // Recent registered users (clean fields, no password hashes)
    const recentUsers = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, last_login_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // Recent administrative audit logs
    const recentActivity = db.prepare(`
      SELECT id, admin_id, admin_email, action, target_user_id, target_user_email, details, created_at
      FROM admin_audit_logs
      ORDER BY created_at DESC
      LIMIT 8
    `).all();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalAdmins,
        activeAdmins,
        administrators,
        totalDevices,
        onlineDevices,
        offlineDevices,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth
      },
      accountStatus: {
        active: activeUsers,
        inactive: inactiveUsers
      },
      registrationTrend,
      recentUsers,
      recentActivity
    });
  } catch (err) {
    console.error('[Admin Dashboard Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to load admin dashboard statistics.' });
  }
});

// ============================================================================
// 2. GET /api/admin/stats - Extended metrics
// ============================================================================
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
    const inactiveUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 0').get().count;
    const admins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get().count;
    const totalReadings = db.prepare('SELECT COUNT(*) as count FROM sensor_readings').get().count;
    const totalAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
    const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
    const totalBatches = db.prepare('SELECT COUNT(*) as count FROM storage_items').get().count;

    return res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers, admins },
        telemetry: { totalReadings, totalAlerts, totalReports, totalBatches }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load system statistics.' });
  }
});

// ============================================================================
// 3. GET /api/admin/users - Server-side Search, Filtering, Sorting, Pagination
// ============================================================================
router.get('/users', (req, res) => {
  try {
    const {
      search = '',
      role = 'ALL',
      status = 'ALL',
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (parsedPage - 1) * parsedLimit;

    const conditions = [];
    const params = [];

    // Search filter: Name, Email, or User ID
    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      conditions.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(id) LIKE ?)');
      params.push(q, q, q);
    }

    // Role filter
    if (role && role !== 'ALL') {
      conditions.push('role = ?');
      params.push(role.toUpperCase());
    }

    // Status filter
    if (status && status !== 'ALL') {
      if (status.toUpperCase() === 'ACTIVE') {
        conditions.push('is_active = 1');
      } else if (status.toUpperCase() === 'INACTIVE') {
        conditions.push('is_active = 0');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'ORDER BY created_at DESC';
    switch (sort) {
      case 'oldest':
        orderBy = 'ORDER BY created_at ASC';
        break;
      case 'name_asc':
        orderBy = 'ORDER BY name ASC';
        break;
      case 'name_desc':
        orderBy = 'ORDER BY name DESC';
        break;
      case 'last_login':
        orderBy = 'ORDER BY last_login_at DESC NULLS LAST';
        break;
      case 'newest':
      default:
        orderBy = 'ORDER BY created_at DESC';
        break;
    }

    // Count query
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params);
    const total = countRow ? countRow.count : 0;
    const totalPages = Math.ceil(total / parsedLimit) || 1;

    // Data query (NEVER expose password_hash)
    const users = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at, last_login_at
      FROM users
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, parsedLimit, offset);

    return res.json({
      success: true,
      users,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages
    });
  } catch (err) {
    console.error('[Admin Users List Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user accounts.' });
  }
});

// ============================================================================
// 4. GET /api/admin/users/:id - Single User Details for Drawer
// ============================================================================
router.get('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at, last_login_at
      FROM users
      WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Count user's associated items
    const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE user_id = ?').get(id)?.count || 0;
    const batchCount = db.prepare('SELECT COUNT(*) as count FROM storage_items WHERE user_id = ?').get(id)?.count || 0;
    const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE user_id = ?').get(id)?.count || 0;

    return res.json({
      success: true,
      user: {
        ...user,
        deviceCount,
        batchCount,
        reportCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load user details.' });
  }
});

// ============================================================================
// 5. PATCH /api/admin/users/:id - Edit User Account Details
// ============================================================================
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    const existingUser = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const updates = [];
    const params = [];
    const changeDetails = {};

    // Validate Name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters long.' });
      }
      const trimmedName = name.trim();
      if (trimmedName !== existingUser.name) {
        updates.push('name = ?');
        params.push(trimmedName);
        changeDetails.name = { from: existingUser.name, to: trimmedName };
      }
    }

    // Validate Email
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
      if (cleanEmail !== existingUser.email.toLowerCase()) {
        const checkConflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(cleanEmail, id);
        if (checkConflict) {
          return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        updates.push('email = ?');
        params.push(cleanEmail);
        changeDetails.email = { from: existingUser.email, to: cleanEmail };
      }
    }

    // Validate Role change & Last-admin protection
    if (role !== undefined) {
      const targetRole = String(role).toUpperCase();
      if (!['USER', 'ADMIN'].includes(targetRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role. Allowed values: USER, ADMIN.' });
      }
      if (existingUser.role === 'ADMIN' && targetRole === 'USER') {
        const activeAdmins = getActiveAdminCount();
        if (activeAdmins <= 1) {
          return res.status(400).json({
            success: false,
            error: 'LAST_ADMIN_PROTECTION',
            message: 'At least one active administrator must remain.'
          });
        }
      }
      if (targetRole !== existingUser.role) {
        updates.push('role = ?');
        params.push(targetRole);
        changeDetails.role = { from: existingUser.role, to: targetRole };
      }
    }

    // Validate Status change & Last-admin protection
    if (is_active !== undefined) {
      const targetActive = is_active ? 1 : 0;
      if (existingUser.role === 'ADMIN' && targetActive === 0) {
        const activeAdmins = getActiveAdminCount();
        if (activeAdmins <= 1) {
          return res.status(400).json({
            success: false,
            error: 'LAST_ADMIN_PROTECTION',
            message: 'At least one active administrator must remain.'
          });
        }
      }
      if (targetActive !== existingUser.is_active) {
        updates.push('is_active = ?');
        params.push(targetActive);
        changeDetails.is_active = { from: existingUser.is_active, to: targetActive };
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'No changes detected.', user: existingUser });
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    params.push(now);
    params.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedUser = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at, last_login_at
      FROM users
      WHERE id = ?
    `).get(id);

    // Sync persistent storage
    await updatePersistentUserMeta(existingUser.email, {
      name: updatedUser.name,
      role: updatedUser.role,
      is_active: updatedUser.is_active
    });

    // Record audit log
    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'USER_UPDATED',
      targetUserId: id,
      targetUserEmail: updatedUser.email,
      details: changeDetails,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({
      success: true,
      message: 'User account updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('[Admin Update User Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user account.' });
  }
});

// ============================================================================
// 6. PATCH /api/admin/users/:id/activate - Activate Account
// ============================================================================
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    db.prepare('UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    await updatePersistentUserMeta(user.email, { is_active: 1 });

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'USER_ACTIVATED',
      targetUserId: id,
      targetUserEmail: user.email,
      details: 'Account activated by administrator',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({
      success: true,
      message: 'User account activated successfully.',
      status: 'ACTIVE'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to activate user account.' });
  }
});

// ============================================================================
// 7. PATCH /api/admin/users/:id/deactivate - Deactivate Account
// ============================================================================
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // MAIN_ADMIN protection
    if (user.role === 'MAIN_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'MAIN_ADMIN_PROTECTED',
        message: 'Main Administrator account is permanently protected and cannot be deactivated.'
      });
    }

    // Self-deactivation protection
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'SELF_DEACTIVATION_PREVENTED',
        message: 'You cannot deactivate your own administrator account.'
      });
    }

    // Last-admin protection
    if (['ADMIN', 'MAIN_ADMIN'].includes(user.role)) {
      const activeAdmins = getActiveAdminCount();
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          error: 'LAST_ADMIN_PROTECTION',
          message: 'At least one active administrator must remain.'
        });
      }
    }

    db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    await updatePersistentUserMeta(user.email, { is_active: 0 });

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'USER_DEACTIVATED',
      targetUserId: id,
      targetUserEmail: user.email,
      details: 'Account deactivated by administrator',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({
      success: true,
      message: 'User account deactivated successfully.',
      status: 'INACTIVE'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate user account.' });
  }
});

// ============================================================================
// 8. PATCH /api/admin/users/:id/role - Change User Role
// ============================================================================
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const targetRole = String(role || '').toUpperCase();
    if (!['USER', 'ADMIN'].includes(targetRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Supported: USER, ADMIN.' });
    }

    const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Main Admin role protection
    if (user.role === 'MAIN_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'MAIN_ADMIN_PROTECTED',
        message: 'Main Administrator role is permanently protected and cannot be modified.'
      });
    }

    // Last-admin protection when demoting from ADMIN to USER
    if (user.role === 'ADMIN' && targetRole === 'USER') {
      const activeAdmins = getActiveAdminCount();
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          error: 'LAST_ADMIN_PROTECTION',
          message: 'At least one active administrator must remain.'
        });
      }
    }

    db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetRole, id);
    await updatePersistentUserMeta(user.email, { role: targetRole });

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ROLE_CHANGED',
      targetUserId: id,
      targetUserEmail: user.email,
      details: `Role changed from ${user.role} to ${targetRole}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({
      success: true,
      message: `User role updated to ${targetRole} successfully.`,
      role: targetRole
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to change user role.' });
  }
});

// ============================================================================
// 9. DELETE /api/admin/users/:id - Permanent Account Deletion
// ============================================================================
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.body || {};

    // Confirmation text validation (must be exact word "DELETE")
    if (!confirmation || confirmation.trim().toUpperCase() !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'CONFIRMATION_REQUIRED',
        message: 'Explicit confirmation required. Please type "DELETE" to confirm permanent account deletion.'
      });
    }

    const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // MAIN_ADMIN protection
    if (user.role === 'MAIN_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'MAIN_ADMIN_PROTECTED',
        message: 'Main Administrator account is permanently protected and cannot be deleted.'
      });
    }

    // SECTION 20: Self-deletion protection
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'SELF_DELETION_PREVENTED',
        message: 'You cannot delete your own administrator account.'
      });
    }

    // SECTION 21: Last-admin protection
    if (['ADMIN', 'MAIN_ADMIN'].includes(user.role)) {
      const activeAdmins = getActiveAdminCount();
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          error: 'LAST_ADMIN_PROTECTION',
          message: 'At least one active administrator must remain.'
        });
      }
    }

    // Safe database cleanup: remove user settings, unlink devices, remove user
    db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(id);
    db.prepare("UPDATE devices SET is_active = 0, status = 'disconnected' WHERE user_id = ?").run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    // Remove from persistent JSON & Vercel Blob cloud store
    await deletePersistentUser(user.email);

    // Record audit log
    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'USER_DELETED',
      targetUserId: id,
      targetUserEmail: user.email,
      details: `Permanently deleted account ${user.email} (ID: ${user.id})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({
      success: true,
      message: 'User account deleted successfully.',
      deletedUserId: id
    });
  } catch (err) {
    console.error('[Admin Delete User Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user account.' });
  }
});

// ============================================================================
// 10. POST /api/admin/users/bulk-delete - Bulk Account Deletion
// ============================================================================
router.post('/users/bulk-delete', async (req, res) => {
  try {
    const { user_ids, confirmation } = req.body || {};

    if (!confirmation || confirmation.trim().toUpperCase() !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'CONFIRMATION_REQUIRED',
        message: 'Explicit confirmation required. Please type "DELETE" to confirm bulk deletion.'
      });
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-empty list of user IDs to delete.' });
    }

    let deletedCount = 0;
    const failedResults = [];
    const deletedEmails = [];

    for (const id of user_ids) {
      const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(id);
      if (!user) {
        failedResults.push({ id, reason: 'User not found' });
        continue;
      }

      // Main Admin check
      if (user.role === 'MAIN_ADMIN') {
        failedResults.push({ id, email: user.email, reason: 'Main Administrator account is permanently protected' });
        continue;
      }

      // Self-deletion check
      if (user.id === req.user.id) {
        failedResults.push({ id, email: user.email, reason: 'Cannot delete current administrator' });
        continue;
      }

      // Last admin check
      if (['ADMIN', 'MAIN_ADMIN'].includes(user.role)) {
        const activeAdmins = getActiveAdminCount();
        if (activeAdmins <= 1) {
          failedResults.push({ id, email: user.email, reason: 'Cannot delete the last active administrator' });
          continue;
        }
      }

      try {
        db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(id);
        db.prepare("UPDATE devices SET is_active = 0, status = 'disconnected' WHERE user_id = ?").run(id);
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        await deletePersistentUser(user.email);
        deletedEmails.push(user.email);
        deletedCount++;
      } catch (delErr) {
        failedResults.push({ id, email: user.email, reason: delErr.message });
      }
    }

    if (deletedCount > 0) {
      recordAuditLog({
        adminId: req.user.id,
        adminEmail: req.user.email,
        action: 'BULK_USERS_DELETED',
        targetUserId: null,
        targetUserEmail: `${deletedCount} users`,
        details: { deletedEmails, failedResults },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
      });
    }

    return res.json({
      success: true,
      deleted: deletedCount,
      failed: failedResults.length,
      results: failedResults,
      message: `${deletedCount} user accounts deleted successfully.${failedResults.length > 0 ? ` (${failedResults.length} skipped)` : ''}`
    });
  } catch (err) {
    console.error('[Bulk Delete Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to process bulk deletion.' });
  }
});

// ============================================================================
// 11. GET /api/admin/audit-logs - Administrative Activity Logs
// ============================================================================
router.get('/audit-logs', (req, res) => {
  try {
    const { search = '', action = 'ALL', page = 1, limit = 25 } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (parsedPage - 1) * parsedLimit;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      conditions.push('(LOWER(admin_email) LIKE ? OR LOWER(target_user_email) LIKE ? OR LOWER(details) LIKE ?)');
      params.push(q, q, q);
    }

    if (action && action !== 'ALL') {
      conditions.push('action = ?');
      params.push(action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM admin_audit_logs ${whereClause}`).get(...params);
    const total = countRow ? countRow.count : 0;
    const totalPages = Math.ceil(total / parsedLimit) || 1;

    const logs = db.prepare(`
      SELECT id, admin_id, admin_email, action, target_user_id, target_user_email, details, ip_address, created_at
      FROM admin_audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parsedLimit, offset);

    return res.json({
      success: true,
      logs,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages
    });
  } catch (err) {
    console.error('[Audit Logs Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to load audit logs.' });
  }
});

// ============================================================================
// 12. GET /api/admin/system - System Overview & Health Status
// ============================================================================
router.get('/system', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const readingCount = db.prepare('SELECT COUNT(*) as count FROM sensor_readings').get().count;
    const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
    const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
    const auditCount = db.prepare('SELECT COUNT(*) as count FROM admin_audit_logs').get().count;

    const memory = process.memoryUsage();

    return res.json({
      success: true,
      services: {
        database: {
          name: 'Database Engine',
          status: 'Operational',
          engine: 'SQLite (node:sqlite DatabaseSync)',
          tables: 9,
          records: {
            users: userCount,
            sensorReadings: readingCount,
            devices: deviceCount,
            alerts: alertCount,
            reports: reportCount,
            auditLogs: auditCount
          }
        },
        api: {
          name: 'REST API & Microservices',
          status: 'Operational',
          uptimeSeconds: Math.floor(process.uptime()),
          memoryRssMb: Math.round((memory.rss / 1024 / 1024) * 10) / 10,
          nodeVersion: process.version,
          platform: process.platform
        },
        auth: {
          name: 'Authentication & RBAC Security',
          status: 'Operational',
          type: 'JWT Token Engine + bcryptjs Hashing',
          lastAdminProtection: 'Enabled'
        },
        reports: {
          name: 'Storage Intelligence PDF Engine',
          status: 'Operational',
          engine: 'jsPDF Core Vector Engine'
        },
        devices: {
          name: 'ESP32 IoT Gateway & Telemetry Service',
          status: 'Operational',
          mode: 'Dual Mode (Real Hardware LAN & Demo Simulation Engine)'
        }
      }
    });
  } catch (err) {
    console.error('[Admin API] Error compiling system health:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health and telemetry overview.'
    });
  }
});

// ============================================================================
// 13. GET /api/admin/admins - List Administrators
// ============================================================================
router.get('/admins', requirePermission('admin_management'), (req, res) => {
  try {
    const { search = '', status = 'ALL' } = req.query;

    const conditions = ["role IN ('ADMIN', 'MAIN_ADMIN')"];
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      conditions.push('(LOWER(name) LIKE ? OR LOWER(username) LIKE ? OR LOWER(email) LIKE ?)');
      params.push(q, q, q);
    }

    if (status && status !== 'ALL') {
      if (status.toUpperCase() === 'ACTIVE') {
        conditions.push('is_active = 1');
      } else if (status.toUpperCase() === 'INACTIVE') {
        conditions.push('is_active = 0');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const admins = db.prepare(`
      SELECT u.id, u.name, u.username, u.email, u.role, u.is_active, u.created_at, u.updated_at, u.last_login_at,
             p.full_access, p.user_management, p.admin_management, p.device_management,
             p.storage_management, p.sensor_monitoring, p.spoilage_monitoring,
             p.alert_management, p.analytics, p.reports, p.system_settings, p.audit_logs
      FROM users u
      LEFT JOIN admin_permissions p ON u.id = p.user_id
      ${whereClause}
      ORDER BY CASE WHEN u.role = 'MAIN_ADMIN' THEN 0 ELSE 1 END, u.created_at ASC
    `).all(...params);

    const formatted = admins.map((a) => {
      const isMain = a.role === 'MAIN_ADMIN';
      const isFull = isMain || a.full_access === 1;
      return {
        id: a.id,
        name: a.name,
        username: a.username || (isMain ? 'vegsense' : 'admin'),
        email: a.email,
        role: a.role,
        is_active: a.is_active,
        status: isMain ? 'PROTECTED' : (a.is_active ? 'ACTIVE' : 'INACTIVE'),
        access_type: isFull ? 'FULL ACCESS' : 'CUSTOM ACCESS',
        permissions: isMain ? {
          full_access: 1,
          user_management: 1,
          admin_management: 1,
          device_management: 1,
          storage_management: 1,
          sensor_monitoring: 1,
          spoilage_monitoring: 1,
          alert_management: 1,
          analytics: 1,
          reports: 1,
          system_settings: 1,
          audit_logs: 1
        } : {
          full_access: a.full_access || 0,
          user_management: a.user_management || 0,
          admin_management: a.admin_management || 0,
          device_management: a.device_management || 0,
          storage_management: a.storage_management || 0,
          sensor_monitoring: a.sensor_monitoring || 0,
          spoilage_monitoring: a.spoilage_monitoring || 0,
          alert_management: a.alert_management || 0,
          analytics: a.analytics || 0,
          reports: a.reports || 0,
          system_settings: a.system_settings || 0,
          audit_logs: a.audit_logs || 0
        },
        created_at: a.created_at,
        last_login_at: a.last_login_at
      };
    });

    return res.json({
      success: true,
      admins: formatted,
      total: formatted.length
    });
  } catch (err) {
    console.error('[Admin List Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve administrators.' });
  }
});

// ============================================================================
// 14. GET /api/admin/admins/:id - Single Administrator Record & Permissions
// ============================================================================
router.get('/admins/:id', requirePermission('admin_management'), (req, res) => {
  try {
    const { id } = req.params;
    const a = db.prepare(`
      SELECT u.id, u.name, u.username, u.email, u.role, u.is_active, u.created_at, u.updated_at, u.last_login_at,
             p.full_access, p.user_management, p.admin_management, p.device_management,
             p.storage_management, p.sensor_monitoring, p.spoilage_monitoring,
             p.alert_management, p.analytics, p.reports, p.system_settings, p.audit_logs
      FROM users u
      LEFT JOIN admin_permissions p ON u.id = p.user_id
      WHERE u.id = ? AND u.role IN ('ADMIN', 'MAIN_ADMIN')
    `).get(id);

    if (!a) {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    const isMain = a.role === 'MAIN_ADMIN';
    const isFull = isMain || a.full_access === 1;

    return res.json({
      success: true,
      admin: {
        id: a.id,
        name: a.name,
        username: a.username || (isMain ? 'vegsense' : 'admin'),
        email: a.email,
        role: a.role,
        is_active: a.is_active,
        status: isMain ? 'PROTECTED' : (a.is_active ? 'ACTIVE' : 'INACTIVE'),
        access_type: isFull ? 'FULL ACCESS' : 'CUSTOM ACCESS',
        permissions: isMain ? {
          full_access: 1,
          user_management: 1,
          admin_management: 1,
          device_management: 1,
          storage_management: 1,
          sensor_monitoring: 1,
          spoilage_monitoring: 1,
          alert_management: 1,
          analytics: 1,
          reports: 1,
          system_settings: 1,
          audit_logs: 1
        } : {
          full_access: a.full_access || 0,
          user_management: a.user_management || 0,
          admin_management: a.admin_management || 0,
          device_management: a.device_management || 0,
          storage_management: a.storage_management || 0,
          sensor_monitoring: a.sensor_monitoring || 0,
          spoilage_monitoring: a.spoilage_monitoring || 0,
          alert_management: a.alert_management || 0,
          analytics: a.analytics || 0,
          reports: a.reports || 0,
          system_settings: a.system_settings || 0,
          audit_logs: a.audit_logs || 0
        },
        created_at: a.created_at,
        last_login_at: a.last_login_at
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve administrator.' });
  }
});

// ============================================================================
// 15. POST /api/admin/admins - Create Administrator
// ============================================================================
router.post('/admins', requirePermission('admin_management'), async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      confirm_password,
      status = 'ACTIVE',
      full_access = false,
      permissions = {}
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name is required (min 2 characters).' });
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Auto-generate or sanitize username to lowercase alphanumeric + underscore
    let cleanUsername = String(username || cleanEmail.split('@')[0] || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (cleanUsername.length < 3) {
      cleanUsername = (cleanUsername + '_adm').slice(0, 20);
    }

    // Password validation (min 8, upper, lower, number, special char)
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    const confirmPwd = confirm_password || req.body.confirmPassword;
    if (confirmPwd && password !== confirmPwd) {
      return res.status(400).json({ success: false, message: 'Confirmation password does not match.' });
    }

    const now = new Date().toISOString();
    const isActive = (status === 'INACTIVE' || req.body.is_active === 0) ? 0 : 1;
    const isFull = Boolean(full_access);
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if email already exists
    const existingUser = db.prepare('SELECT id, name, username, role, is_active FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingUser) {
      if (existingUser.role === 'ADMIN' || existingUser.role === 'MAIN_ADMIN') {
        return res.status(409).json({ success: false, message: 'An administrator account with this email address already exists.' });
      }
      
      // Elevate existing standard USER to ADMIN
      const adminId = existingUser.id;
      db.prepare(`
        UPDATE users
        SET role = 'ADMIN', is_active = ?, password_hash = ?, updated_at = ?
        WHERE id = ?
      `).run(isActive, passwordHash, now, adminId);

      // Upsert permissions
      db.prepare('DELETE FROM admin_permissions WHERE user_id = ?').run(adminId);
      const permId = 'perm_' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO admin_permissions (
          id, user_id, full_access, user_management, admin_management,
          device_management, storage_management, sensor_monitoring,
          spoilage_monitoring, alert_management, analytics, reports,
          system_settings, audit_logs, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        permId,
        adminId,
        isFull ? 1 : 0,
        isFull || permissions.user_management ? 1 : 0,
        isFull || permissions.admin_management ? 1 : 0,
        isFull || permissions.device_management ? 1 : 0,
        isFull || permissions.storage_management ? 1 : 0,
        isFull || permissions.sensor_monitoring ? 1 : 0,
        isFull || permissions.spoilage_monitoring ? 1 : 0,
        isFull || permissions.alert_management ? 1 : 0,
        isFull || permissions.analytics ? 1 : 0,
        isFull || permissions.reports ? 1 : 0,
        isFull || permissions.system_settings ? 1 : 0,
        isFull || permissions.audit_logs ? 1 : 0,
        now,
        now
      );

      await savePersistentUser({
        id: adminId,
        name: existingUser.name || name.trim(),
        username: existingUser.username || cleanUsername,
        email: cleanEmail,
        password_hash: passwordHash,
        role: 'ADMIN',
        is_active: isActive,
        updated_at: now
      });

      recordAuditLog({
        adminId: req.user.id,
        adminEmail: req.user.email,
        action: 'ADMIN_PROMOTED',
        targetUserId: adminId,
        targetUserEmail: cleanEmail,
        details: `Administrator privileges granted to existing user ${cleanEmail}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
      });

      return res.status(201).json({
        success: true,
        message: `Administrator privileges granted to ${cleanEmail}.`,
        admin: {
          id: adminId,
          name: existingUser.name || name.trim(),
          username: existingUser.username || cleanUsername,
          email: cleanEmail,
          role: 'ADMIN',
          is_active: isActive,
          status: isActive ? 'ACTIVE' : 'INACTIVE',
          access_type: isFull ? 'FULL ACCESS' : 'CUSTOM ACCESS',
          created_at: now
        }
      });
    }

    // Check unique username for new accounts
    const existingUsername = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(cleanUsername);
    if (existingUsername) {
      cleanUsername = cleanUsername + '_' + Math.floor(Math.random() * 1000);
    }

    const adminId = 'usr_admin_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO users (id, name, username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'ADMIN', ?, ?, ?)
    `).run(adminId, name.trim(), cleanUsername, cleanEmail, passwordHash, isActive, now, now);

    const permId = 'perm_' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO admin_permissions (
        id, user_id, full_access, user_management, admin_management,
        device_management, storage_management, sensor_monitoring,
        spoilage_monitoring, alert_management, analytics, reports,
        system_settings, audit_logs, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      permId,
      adminId,
      isFull ? 1 : 0,
      isFull || permissions.user_management ? 1 : 0,
      isFull || permissions.admin_management ? 1 : 0,
      isFull || permissions.device_management ? 1 : 0,
      isFull || permissions.storage_management ? 1 : 0,
      isFull || permissions.sensor_monitoring ? 1 : 0,
      isFull || permissions.spoilage_monitoring ? 1 : 0,
      isFull || permissions.alert_management ? 1 : 0,
      isFull || permissions.analytics ? 1 : 0,
      isFull || permissions.reports ? 1 : 0,
      isFull || permissions.system_settings ? 1 : 0,
      isFull || permissions.audit_logs ? 1 : 0,
      now,
      now
    );

    // Save to persistent storage
    await savePersistentUser({
      id: adminId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'ADMIN',
      is_active: isActive,
      created_at: now,
      updated_at: now
    });

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_CREATED',
      targetUserId: adminId,
      targetUserEmail: cleanEmail,
      details: `Main Admin created administrator account ${cleanUsername} (${cleanEmail})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.status(201).json({
      success: true,
      message: 'Administrator account created successfully.',
      admin: {
        id: adminId,
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        role: 'ADMIN',
        is_active: isActive,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        access_type: isFull ? 'FULL ACCESS' : 'CUSTOM ACCESS',
        created_at: now
      }
    });
  } catch (err) {
    console.error('[Create Admin Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create administrator account.' });
  }
});

// ============================================================================
// 16. PATCH /api/admin/admins/:id - Edit Administrator
// ============================================================================
router.patch('/admins/:id', requireMainAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, is_active } = req.body;

    const admin = db.prepare('SELECT id, name, username, email, role, is_active FROM users WHERE id = ?').get(id);
    if (!admin || !['ADMIN', 'MAIN_ADMIN'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    if (admin.role === 'MAIN_ADMIN' && is_active === 0) {
      return res.status(400).json({ success: false, message: 'Main Administrator account cannot be deactivated.' });
    }

    const updates = [];
    const params = [];
    const metaUpdates = {};

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      updates.push('name = ?');
      params.push(name.trim());
      metaUpdates.name = name.trim();
    }

    if (username && typeof username === 'string') {
      const cleanUser = username.trim().toLowerCase();
      if (cleanUser !== (admin.username || '').toLowerCase()) {
        const checkUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?').get(cleanUser, id);
        if (checkUser) {
          return res.status(409).json({ success: false, message: 'Username is already taken.' });
        }
        updates.push('username = ?');
        params.push(cleanUser);
        metaUpdates.username = cleanUser;
      }
    }

    if (email && typeof email === 'string') {
      const cleanMail = email.trim().toLowerCase();
      if (cleanMail !== admin.email.toLowerCase()) {
        const checkMail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(cleanMail, id);
        if (checkMail) {
          return res.status(409).json({ success: false, message: 'Email address is already in use.' });
        }
        updates.push('email = ?');
        params.push(cleanMail);
      }
    }

    if (is_active !== undefined && admin.role !== 'MAIN_ADMIN') {
      const activeVal = is_active ? 1 : 0;
      updates.push('is_active = ?');
      params.push(activeVal);
      metaUpdates.is_active = activeVal;
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'No changes provided.', admin });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    await updatePersistentUserMeta(admin.email, metaUpdates);

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_UPDATED',
      targetUserId: id,
      targetUserEmail: admin.email,
      details: `Administrator account updated: ${Object.keys(metaUpdates).join(', ')}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({
      success: true,
      message: 'Administrator account updated successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update administrator account.' });
  }
});

// ============================================================================
// 17. PATCH /api/admin/admins/:id/activate - Activate Admin
// ============================================================================
router.patch('/admins/:id/activate', requireMainAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const admin = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!admin || !['ADMIN', 'MAIN_ADMIN'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    db.prepare('UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    await updatePersistentUserMeta(admin.email, { is_active: 1 });

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_ACTIVATED',
      targetUserId: id,
      targetUserEmail: admin.email,
      details: `Administrator account ${admin.email} activated`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({ success: true, message: 'Administrator account activated successfully.', status: 'ACTIVE' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to activate administrator account.' });
  }
});

// ============================================================================
// 18. PATCH /api/admin/admins/:id/deactivate - Deactivate Admin
// ============================================================================
router.patch('/admins/:id/deactivate', requireMainAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const admin = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!admin || !['ADMIN', 'MAIN_ADMIN'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    if (admin.role === 'MAIN_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'MAIN_ADMIN_PROTECTED',
        message: 'Main Administrator account is permanently protected and cannot be deactivated.'
      });
    }

    if (admin.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'SELF_DEACTIVATION_PREVENTED',
        message: 'You cannot deactivate your own administrator account.'
      });
    }

    db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    await updatePersistentUserMeta(admin.email, { is_active: 0 });

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_DEACTIVATED',
      targetUserId: id,
      targetUserEmail: admin.email,
      details: `Administrator account ${admin.email} deactivated`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({ success: true, message: 'Administrator account deactivated successfully.', status: 'INACTIVE' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate administrator account.' });
  }
});

// ============================================================================
// 19. DELETE /api/admin/admins/:id - Delete Admin Account
// ============================================================================
router.delete('/admins/:id', requireMainAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.body || {};

    if (!confirmation || confirmation.trim().toUpperCase() !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'CONFIRMATION_REQUIRED',
        message: 'Explicit confirmation required. Please type "DELETE" to permanently delete administrator account.'
      });
    }

    const admin = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!admin || !['ADMIN', 'MAIN_ADMIN'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    if (admin.role === 'MAIN_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'MAIN_ADMIN_PROTECTED',
        message: 'Main Administrator account is permanently protected and cannot be deleted.'
      });
    }

    if (admin.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'SELF_DELETION_PREVENTED',
        message: 'You cannot delete your own administrator account.'
      });
    }

    db.prepare('DELETE FROM admin_permissions WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    await deletePersistentUser(admin.email);

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_DELETED',
      targetUserId: id,
      targetUserEmail: admin.email,
      details: `Permanently deleted administrator account ${admin.email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({ success: true, message: 'Administrator account deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete administrator account.' });
  }
});

// ============================================================================
// 20. GET /api/admin/admins/:id/permissions
// ============================================================================
router.get('/admins/:id/permissions', requireMainAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const admin = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Administrator not found.' });
    }

    if (admin.role === 'MAIN_ADMIN') {
      return res.json({
        success: true,
        permissions: {
          full_access: 1,
          user_management: 1,
          admin_management: 1,
          device_management: 1,
          storage_management: 1,
          sensor_monitoring: 1,
          spoilage_monitoring: 1,
          alert_management: 1,
          analytics: 1,
          reports: 1,
          system_settings: 1,
          audit_logs: 1
        }
      });
    }

    const perm = db.prepare('SELECT * FROM admin_permissions WHERE user_id = ?').get(id);
    return res.json({
      success: true,
      permissions: perm || {
        full_access: 1,
        user_management: 1,
        admin_management: 0,
        device_management: 1,
        storage_management: 1,
        sensor_monitoring: 1,
        spoilage_monitoring: 1,
        alert_management: 1,
        analytics: 1,
        reports: 1,
        system_settings: 0,
        audit_logs: 1
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve permissions.' });
  }
});

// ============================================================================
// 21. PATCH /api/admin/admins/:id/permissions - Change Permissions
// ============================================================================
router.patch('/admins/:id/permissions', requireMainAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { full_access } = req.body;
    const permObj = req.body.permissions && typeof req.body.permissions === 'object'
      ? { ...req.body.permissions, ...req.body }
      : req.body;

    const admin = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!admin || !['ADMIN', 'MAIN_ADMIN'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Administrator not found.' });
    }

    if (admin.role === 'MAIN_ADMIN') {
      return res.status(400).json({ success: false, message: 'Main Administrator already possesses full immutable system authority.' });
    }

    const isFull = Boolean(full_access);
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM admin_permissions WHERE user_id = ?').get(id);
    if (existing) {
      db.prepare(`
        UPDATE admin_permissions SET
          full_access = ?,
          user_management = ?,
          admin_management = ?,
          device_management = ?,
          storage_management = ?,
          sensor_monitoring = ?,
          spoilage_monitoring = ?,
          alert_management = ?,
          analytics = ?,
          reports = ?,
          system_settings = ?,
          audit_logs = ?,
          updated_at = ?
        WHERE user_id = ?
      `).run(
        isFull ? 1 : 0,
        isFull || permObj.user_management ? 1 : 0,
        isFull || permObj.admin_management ? 1 : 0,
        isFull || permObj.device_management ? 1 : 0,
        isFull || permObj.storage_management ? 1 : 0,
        isFull || permObj.sensor_monitoring ? 1 : 0,
        isFull || permObj.spoilage_monitoring ? 1 : 0,
        isFull || permObj.alert_management ? 1 : 0,
        isFull || permObj.analytics ? 1 : 0,
        isFull || permObj.reports ? 1 : 0,
        isFull || permObj.system_settings ? 1 : 0,
        isFull || permObj.audit_logs ? 1 : 0,
        now,
        id
      );
    } else {
      db.prepare(`
        INSERT INTO admin_permissions (
          id, user_id, full_access, user_management, admin_management,
          device_management, storage_management, sensor_monitoring,
          spoilage_monitoring, alert_management, analytics, reports,
          system_settings, audit_logs, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'perm_' + crypto.randomUUID(),
        id,
        isFull ? 1 : 0,
        isFull || permObj.user_management ? 1 : 0,
        isFull || permObj.admin_management ? 1 : 0,
        isFull || permObj.device_management ? 1 : 0,
        isFull || permObj.storage_management ? 1 : 0,
        isFull || permObj.sensor_monitoring ? 1 : 0,
        isFull || permObj.spoilage_monitoring ? 1 : 0,
        isFull || permObj.alert_management ? 1 : 0,
        isFull || permObj.analytics ? 1 : 0,
        isFull || permObj.reports ? 1 : 0,
        isFull || permObj.system_settings ? 1 : 0,
        isFull || permObj.audit_logs ? 1 : 0,
        now,
        now
      );
    }

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_PERMISSION_CHANGED',
      targetUserId: id,
      targetUserEmail: admin.email,
      details: isFull ? 'Main Admin granted Full Access' : `Main Admin customized permissions for ${admin.email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    const updated = db.prepare('SELECT * FROM admin_permissions WHERE user_id = ?').get(id);

    return res.json({
      success: true,
      message: 'Administrator permissions updated successfully.',
      permissions: updated
    });
  } catch (err) {
    console.error('[Update Permissions Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update administrator permissions.' });
  }
});

// ============================================================================
// 22. POST /api/admin/admins/:id/reset-password - Reset Admin Password
// ============================================================================
router.post('/admins/:id/reset-password', requireMainAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const admin = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!admin || !['ADMIN', 'MAIN_ADMIN'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Administrator not found.' });
    }

    // Generate secure temporary password if none provided
    const newPassword = password || `TempAdmin@${crypto.randomBytes(4).toString('hex')}!`;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, id);
    await updatePersistentPassword(admin.email, passwordHash);

    recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ADMIN_PASSWORD_RESET',
      targetUserId: id,
      targetUserEmail: admin.email,
      details: `Main Admin reset password for administrator ${admin.email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    return res.json({
      success: true,
      message: 'Administrator password reset successfully.',
      temporaryPassword: password ? undefined : newPassword
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset administrator password.' });
  }
});

// ============================================================================
// 23. GET /api/admin/devices - System-Level Devices Directory
// ============================================================================
router.get('/devices', requirePermission('device_management'), (req, res) => {
  try {
    const { search = '', status = 'ALL' } = req.query;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      conditions.push('(LOWER(d.device_name) LIKE ? OR LOWER(d.id) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)');
      params.push(q, q, q, q);
    }

    if (status && status !== 'ALL') {
      conditions.push('d.status = ?');
      params.push(status.toLowerCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const devices = db.prepare(`
      SELECT d.id, d.user_id, d.device_name, d.ip_address, d.status, d.last_connected, d.created_at,
             u.name as owner_name, u.email as owner_email
      FROM devices d
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
    `).all(...params);

    return res.json({
      success: true,
      devices,
      total: devices.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve system devices.' });
  }
});

export default router;
