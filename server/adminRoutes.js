import express from 'express';
import db, {
  savePersistentUser,
  deletePersistentUser,
  updatePersistentUserMeta,
  recordAuditLog,
  syncPersistentUsers
} from './db.js';
import { requireAdmin } from './authRoutes.js';

const router = express.Router();

// All admin routes strictly require authenticated ADMIN role
router.use(requireAdmin);

// Helper to count active administrators
function getActiveAdminCount() {
  const row = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND is_active = 1").get();
  return row?.count || 0;
}

// ============================================================================
// 1. GET /api/admin/dashboard - Enterprise Summary Statistics & Activity
// ============================================================================
router.get('/dashboard', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
    const inactiveUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 0').get().count;
    const administrators = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get().count;

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

    // Self-deactivation protection
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'SELF_DEACTIVATION_PREVENTED',
        message: 'You cannot deactivate your own administrator account.'
      });
    }

    // Last-admin protection
    if (user.role === 'ADMIN') {
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

    // SECTION 20: Self-deletion protection
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'SELF_DELETION_PREVENTED',
        message: 'You cannot delete your own administrator account.'
      });
    }

    // SECTION 21: Last-admin protection
    if (user.role === 'ADMIN') {
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

      // Self-deletion check
      if (user.id === req.user.id) {
        failedResults.push({ id, email: user.email, reason: 'Cannot delete current administrator' });
        continue;
      }

      // Last admin check
      if (user.role === 'ADMIN') {
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
    return res.status(500).json({ success: false, message: 'Failed to load system health overview.' });
  }
});

export default router;
