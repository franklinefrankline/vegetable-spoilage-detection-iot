import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { put as vercelBlobPut } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
export const VERCEL_BLOB_USERS_URL = 'https://qt2vvaxz4l6gzvby.public.blob.vercel-storage.com/persistent_users.json';

// Persistent JSON backup locations
export const BUNDLED_USERS_PATH = path.join(__dirname, 'persistent_users.json');
export const PERSISTENT_USERS_PATH = isVercel
  ? path.join('/tmp', 'persistent_users.json')
  : BUNDLED_USERS_PATH;

// Local SQLite database location
const localDbPath = path.join(__dirname, 'database.sqlite');
const dbPath = isVercel
  ? path.join('/tmp', 'database.sqlite')
  : localDbPath;

// On Vercel, copy the local SQLite database and persistent users to /tmp if they don't exist yet
if (isVercel) {
  try {
    if (!fs.existsSync('/tmp/database.sqlite') && fs.existsSync(localDbPath)) {
      fs.copyFileSync(localDbPath, '/tmp/database.sqlite');
      console.log('[DB] Seeded /tmp/database.sqlite from local package.');
    }
  } catch (copyErr) {
    console.warn('[DB] Could not copy local db to /tmp:', copyErr.message);
  }

  try {
    if (!fs.existsSync(PERSISTENT_USERS_PATH) && fs.existsSync(BUNDLED_USERS_PATH)) {
      fs.copyFileSync(BUNDLED_USERS_PATH, PERSISTENT_USERS_PATH);
      console.log('[DB] Seeded /tmp/persistent_users.json from bundled package.');
    }
  } catch (copyErr) {
    console.warn('[DB] Could not copy persistent users to /tmp:', copyErr.message);
  }
}

const db = new DatabaseSync(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    status TEXT DEFAULT 'connected',
    last_connected DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sensor_readings (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    gas_level INTEGER NOT NULL,
    light_level REAL DEFAULT 420,
    spoilage_risk INTEGER NOT NULL,
    light_risk INTEGER DEFAULT 10,
    light_classification TEXT DEFAULT 'NORMAL LIGHT',
    storage_status TEXT NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    value TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS storage_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    vegetable_name TEXT NOT NULL,
    variety TEXT,
    quantity TEXT,
    target_temp REAL,
    target_humidity REAL,
    status TEXT DEFAULT 'FRESH',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_resets_token ON password_resets(token);
  CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
  CREATE INDEX IF NOT EXISTS idx_readings_device ON sensor_readings(device_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id);
  CREATE INDEX IF NOT EXISTS idx_storage_user ON storage_items(user_id);
`);

// Migration: Ensure sensor_readings has all Part 8 fields & indexes
const sensorReadingColumns = [
  { name: 'user_id', type: "TEXT DEFAULT 'usr_demo_vegsense_001'" },
  { name: 'storage_batch_id', type: 'TEXT' },
  { name: 'vegetable_type', type: 'TEXT' },
  { name: 'source_mode', type: "TEXT DEFAULT 'DEMO'" },
  { name: 'source', type: "TEXT DEFAULT 'demo'" },
  { name: 'light_level', type: 'REAL DEFAULT 420' },
  { name: 'light_classification', type: 'TEXT DEFAULT "NORMAL LIGHT"' },
  { name: 'light_risk', type: 'INTEGER DEFAULT 10' },
  { name: 'is_temp_unavailable', type: 'INTEGER DEFAULT 0' },
  { name: 'is_hum_unavailable', type: 'INTEGER DEFAULT 0' },
  { name: 'is_gas_unavailable', type: 'INTEGER DEFAULT 0' },
  { name: 'is_light_unavailable', type: 'INTEGER DEFAULT 0' }
];

for (const col of sensorReadingColumns) {
  try {
    db.exec(`ALTER TABLE sensor_readings ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column already exists, safe to ignore
  }
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS spoilage_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      device_id TEXT NOT NULL,
      storage_batch_id TEXT,
      vegetable_type TEXT,
      temperature_risk INTEGER NOT NULL,
      humidity_risk INTEGER NOT NULL,
      gas_risk INTEGER NOT NULL,
      light_risk INTEGER NOT NULL,
      storage_age_risk INTEGER NOT NULL,
      spoilage_risk INTEGER NOT NULL,
      classification TEXT NOT NULL,
      source_mode TEXT DEFAULT 'DEMO',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_spoilage_user_created ON spoilage_history(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_spoilage_device_created ON spoilage_history(device_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_spoilage_batch_created ON spoilage_history(storage_batch_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_readings_user_recorded ON sensor_readings(user_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_readings_dev_recorded ON sensor_readings(device_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_readings_batch_recorded ON sensor_readings(storage_batch_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_readings_source_mode ON sensor_readings(source_mode);
  `);
} catch (e) {
  // Safe to ignore if already exists
}

try {
  db.exec("ALTER TABLE spoilage_history ADD COLUMN vegetable_type TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE spoilage_history ADD COLUMN source_mode TEXT DEFAULT 'DEMO'");
} catch (e) {}

// Migration: Ensure storage_items has all production fields
const storageColumns = [
  { name: 'batch_number', type: 'TEXT' },
  { name: 'storage_chamber', type: 'TEXT DEFAULT "Chamber #04"' },
  { name: 'device_id', type: 'TEXT DEFAULT "ESP32-DEMO-001"' },
  { name: 'optimal_temp_min', type: 'REAL DEFAULT 18.0' },
  { name: 'optimal_temp_max', type: 'REAL DEFAULT 24.0' },
  { name: 'optimal_humidity_min', type: 'REAL DEFAULT 65.0' },
  { name: 'optimal_humidity_max', type: 'REAL DEFAULT 75.0' },
  { name: 'shelf_life_days', type: 'INTEGER DEFAULT 14' },
  { name: 'spoilage_risk', type: 'INTEGER DEFAULT 18' },
  { name: 'is_active', type: 'INTEGER DEFAULT 0' },
  { name: 'notes', type: 'TEXT' },
  { name: 'updated_at', type: 'TEXT' }
];

for (const col of storageColumns) {
  try {
    db.exec(`ALTER TABLE storage_items ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column already exists, safe to ignore
  }
}

// Migration: Ensure alerts has all Part 7 production fields & indexes
const alertColumns = [
  { name: 'user_id', type: "TEXT DEFAULT 'usr_demo_vegsense_001'" },
  { name: 'storage_batch_id', type: 'TEXT' },
  { name: 'alert_type', type: "TEXT DEFAULT 'SYSTEM'" },
  { name: 'title', type: "TEXT DEFAULT 'System Alert'" },
  { name: 'status', type: "TEXT DEFAULT 'ACTIVE'" },
  { name: 'source', type: "TEXT DEFAULT 'SYSTEM'" },
  { name: 'threshold', type: 'TEXT' },
  { name: 'previous_value', type: 'TEXT' },
  { name: 'event_key', type: "TEXT DEFAULT ''" },
  { name: 'metadata', type: "TEXT DEFAULT '{}'" },
  { name: 'updated_at', type: 'DATETIME' },
  { name: 'read_at', type: 'DATETIME' },
  { name: 'resolved_at', type: 'DATETIME' },
  { name: 'last_seen_at', type: 'DATETIME' }
];

for (const col of alertColumns) {
  try {
    db.exec(`ALTER TABLE alerts ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column already exists, safe to ignore
  }
}

try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON alerts(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_alerts_user_event_key ON alerts(user_id, event_key);
    CREATE INDEX IF NOT EXISTS idx_alerts_device_status ON alerts(device_id, status);
    CREATE INDEX IF NOT EXISTS idx_alerts_batch_created ON alerts(storage_batch_id, created_at);
  `);
} catch (e) {
  // Safe to ignore if already created
}

// Migration: Ensure reports table has all Part 9 production fields & indexes
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT,
      storage_url TEXT,
      device_id TEXT,
      storage_batch_id TEXT,
      vegetable_type TEXT,
      source_mode TEXT DEFAULT 'ALL',
      from_date TEXT,
      to_date TEXT,
      status TEXT DEFAULT 'COMPLETED',
      file_size INTEGER DEFAULT 0,
      sections TEXT,
      summary_data TEXT,
      recommendations TEXT,
      pdf_base64 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_reports_user_status ON reports(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_reports_user_type ON reports(user_id, report_type);
    CREATE INDEX IF NOT EXISTS idx_reports_user_batch ON reports(user_id, storage_batch_id);
  `);
} catch (e) {
  // Safe to ignore if already exists
}

// Migration: Ensure devices has Part 10 production fields
const deviceColumns = [
  { name: 'device_identifier', type: 'TEXT' },
  { name: 'mode', type: "TEXT DEFAULT 'REAL'" },
  { name: 'last_seen', type: 'DATETIME' },
  { name: 'is_active', type: 'INTEGER DEFAULT 1' }
];

for (const col of deviceColumns) {
  try {
    db.exec(`ALTER TABLE devices ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column already exists or error, safe to ignore
  }
}

// Migration: Ensure user_settings table exists with all Part 10 settings & thresholds
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      theme TEXT DEFAULT 'forest',
      accent TEXT DEFAULT 'green',
      card_style TEXT DEFAULT 'rounded',
      font_size TEXT DEFAULT 'medium',
      animation TEXT DEFAULT 'subtle',
      notifications_enabled INTEGER DEFAULT 1,
      browser_notifications_enabled INTEGER DEFAULT 0,
      critical_alerts_enabled INTEGER DEFAULT 1,
      high_alerts_enabled INTEGER DEFAULT 1,
      warning_alerts_enabled INTEGER DEFAULT 1,
      info_alerts_enabled INTEGER DEFAULT 1,
      temperature_alerts_enabled INTEGER DEFAULT 1,
      humidity_alerts_enabled INTEGER DEFAULT 1,
      gas_alerts_enabled INTEGER DEFAULT 1,
      light_alerts_enabled INTEGER DEFAULT 1,
      spoilage_alerts_enabled INTEGER DEFAULT 1,
      expiry_alerts_enabled INTEGER DEFAULT 1,
      device_alerts_enabled INTEGER DEFAULT 1,
      sensor_alerts_enabled INTEGER DEFAULT 1,
      sensor_temp_enabled INTEGER DEFAULT 1,
      sensor_hum_enabled INTEGER DEFAULT 1,
      sensor_gas_enabled INTEGER DEFAULT 1,
      sensor_light_enabled INTEGER DEFAULT 1,
      light_sensor_type TEXT DEFAULT 'BH1750',
      temperature_warning_threshold REAL DEFAULT 30.0,
      temperature_high_threshold REAL DEFAULT 35.0,
      humidity_low_threshold REAL DEFAULT 50.0,
      humidity_high_threshold REAL DEFAULT 80.0,
      gas_elevated_threshold REAL DEFAULT 500.0,
      gas_high_threshold REAL DEFAULT 700.0,
      light_low_threshold REAL DEFAULT 100.0,
      light_high_threshold REAL DEFAULT 500.0,
      spoilage_warning_threshold REAL DEFAULT 31.0,
      spoilage_risk_threshold REAL DEFAULT 61.0,
      spoilage_critical_threshold REAL DEFAULT 81.0,
      weight_temperature REAL DEFAULT 30.0,
      weight_humidity REAL DEFAULT 25.0,
      weight_gas REAL DEFAULT 25.0,
      weight_light REAL DEFAULT 10.0,
      weight_age REAL DEFAULT 10.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
  `);
} catch (e) {
  // Safe to ignore if already exists
}

// Migration: Ensure users table has Part 11 Enterprise Admin fields & indexes
const userAdminColumns = [
  { name: 'role', type: "TEXT DEFAULT 'USER'" },
  { name: 'is_active', type: 'INTEGER DEFAULT 1' },
  { name: 'last_login_at', type: 'DATETIME' }
];

for (const col of userAdminColumns) {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column already exists, safe to ignore
  }
}

try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_user_id TEXT,
      target_user_email TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_admin_created ON admin_audit_logs(admin_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_action_created ON admin_audit_logs(action, created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_target_created ON admin_audit_logs(target_user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at);
  `);
} catch (e) {
  // Safe to ignore if already exists
}

/**
 * Reads all users from persistent_users.json (and Vercel Blob cloud store) and inserts/updates them in the database.
 * This guarantees user data is NEVER lost even if SQLite is freshly initialized or code updates.
 */
export async function syncPersistentUsers(fetchRemote = true) {
  try {
    const pathsToSync = [BUNDLED_USERS_PATH];
    if (PERSISTENT_USERS_PATH !== BUNDLED_USERS_PATH && fs.existsSync(PERSISTENT_USERS_PATH)) {
      pathsToSync.push(PERSISTENT_USERS_PATH);
    }

    const insertStmt = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = COALESCE(users.role, excluded.role),
        is_active = COALESCE(users.is_active, excluded.is_active),
        last_login_at = COALESCE(excluded.last_login_at, users.last_login_at),
        updated_at = excluded.updated_at
    `);

    let totalSynced = 0;
    const seenEmails = new Set();

    // 1. Sync from local / bundled files
    for (const p of pathsToSync) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8');
          const users = JSON.parse(content || '[]');
          for (const u of users) {
            if (u.id && u.name && u.email && u.password_hash) {
              const cleanEmail = u.email.toLowerCase().trim();
              const userRole = u.role || (cleanEmail === 'demo@vegsense.io' || cleanEmail === 'admin@vegsense.io' ? 'ADMIN' : 'USER');
              const isActive = u.is_active !== undefined ? (u.is_active ? 1 : 0) : 1;
              insertStmt.run(
                u.id,
                u.name,
                cleanEmail,
                u.password_hash,
                userRole,
                isActive,
                u.last_login_at || null,
                u.created_at || new Date().toISOString(),
                u.updated_at || new Date().toISOString()
              );
              if (!seenEmails.has(cleanEmail)) {
                seenEmails.add(cleanEmail);
                totalSynced++;
              }
            }
          }
        } catch (readErr) {
          console.warn(`[DB] Notice reading ${p}:`, readErr.message);
        }
      }
    }

    // 2. Sync from Vercel Blob cloud store (if remote fetch is enabled)
    if (fetchRemote) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${VERCEL_BLOB_USERS_URL}?t=${Date.now()}`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        clearTimeout(timeout);
        if (res.ok) {
          const remoteUsers = await res.json();
          if (Array.isArray(remoteUsers)) {
            for (const u of remoteUsers) {
              if (u.id && u.name && u.email && u.password_hash) {
                const cleanEmail = u.email.toLowerCase().trim();
                const userRole = u.role || (cleanEmail === 'demo@vegsense.io' || cleanEmail === 'admin@vegsense.io' ? 'ADMIN' : 'USER');
                const isActive = u.is_active !== undefined ? (u.is_active ? 1 : 0) : 1;
                insertStmt.run(
                  u.id,
                  u.name,
                  cleanEmail,
                  u.password_hash,
                  userRole,
                  isActive,
                  u.last_login_at || null,
                  u.created_at || new Date().toISOString(),
                  u.updated_at || new Date().toISOString()
                );
                if (!seenEmails.has(cleanEmail)) {
                  seenEmails.add(cleanEmail);
                  totalSynced++;
                }
              }
            }
            try {
              fs.writeFileSync(PERSISTENT_USERS_PATH, JSON.stringify(remoteUsers, null, 2), 'utf-8');
            } catch (wErr) {}
          }
        }
      } catch (remoteErr) {
        // Safe to ignore if offline or not yet uploaded
      }
    }

    console.log(`[DB] Successfully synced ${totalSynced} persistent user accounts.`);
  } catch (err) {
    console.warn('[DB] Notice: Could not sync persistent users:', err.message);
  }
}

/**
 * Persists a user account into persistent_users.json and Vercel Blob permanently.
 */
export async function savePersistentUser(user) {
  try {
    let users = [];
    if (fs.existsSync(PERSISTENT_USERS_PATH)) {
      try {
        const content = fs.readFileSync(PERSISTENT_USERS_PATH, 'utf-8');
        users = JSON.parse(content || '[]');
      } catch (parseErr) {
        users = [];
      }
    }

    const cleanEmail = user.email.toLowerCase().trim();
    const existingIndex = users.findIndex((u) => u.email && u.email.toLowerCase().trim() === cleanEmail);

    const record = {
      id: user.id,
      name: user.name,
      email: cleanEmail,
      password_hash: user.password_hash,
      role: user.role || (existingIndex >= 0 ? users[existingIndex].role : 'USER') || 'USER',
      is_active: user.is_active !== undefined ? (user.is_active ? 1 : 0) : (existingIndex >= 0 && users[existingIndex].is_active !== undefined ? users[existingIndex].is_active : 1),
      last_login_at: user.last_login_at || (existingIndex >= 0 ? users[existingIndex].last_login_at : null),
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...record };
    } else {
      users.push(record);
    }

    try {
      fs.writeFileSync(PERSISTENT_USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
    } catch (fsErr) {}

    // Upload to Vercel Blob cloud store permanently
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await vercelBlobPut('persistent_users.json', JSON.stringify(users, null, 2), {
          access: 'public',
          addRandomSuffix: false
        });
      } catch (blobErr) {
        console.warn('[DB] Notice: Could not upload users to Vercel Blob:', blobErr.message);
      }
    }
  } catch (err) {
    console.warn('[DB] Notice: Could not write to persistent_users.json:', err.message);
  }
}

/**
 * Updates a user's persistent metadata (role, is_active, name, last_login_at) in JSON & Blob.
 */
export async function updatePersistentUserMeta(email, meta = {}) {
  try {
    let users = [];
    if (fs.existsSync(PERSISTENT_USERS_PATH)) {
      try {
        const content = fs.readFileSync(PERSISTENT_USERS_PATH, 'utf-8');
        users = JSON.parse(content || '[]');
      } catch (e) {
        users = [];
      }
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email && u.email.toLowerCase().trim() === cleanEmail);
    if (user) {
      if (meta.name !== undefined) user.name = meta.name;
      if (meta.role !== undefined) user.role = meta.role;
      if (meta.is_active !== undefined) user.is_active = meta.is_active ? 1 : 0;
      if (meta.last_login_at !== undefined) user.last_login_at = meta.last_login_at;
      user.updated_at = new Date().toISOString();
      try {
        fs.writeFileSync(PERSISTENT_USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
      } catch (e) {}

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          await vercelBlobPut('persistent_users.json', JSON.stringify(users, null, 2), {
            access: 'public',
            addRandomSuffix: false
          });
        } catch (blobErr) {
          console.warn('[DB] Notice: Could not upload updated user meta to Vercel Blob:', blobErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('[DB] Notice: Could not update persistent user metadata:', err.message);
  }
}

/**
 * Records an entry into the enterprise admin_audit_logs table.
 */
export function recordAuditLog({ adminId, adminEmail, action, targetUserId = null, targetUserEmail = null, details = '', ipAddress = '' }) {
  try {
    const id = 'log_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const detailString = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, admin_email, action, target_user_id, target_user_email, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      id,
      adminId,
      adminEmail,
      action,
      targetUserId,
      targetUserEmail,
      detailString,
      ipAddress
    );
    return id;
  } catch (err) {
    console.warn('[AuditLog] Notice: Could not record audit log:', err.message);
    return null;
  }
}

/**
 * Updates a user's password in persistent_users.json and Vercel Blob.
 */
export async function updatePersistentPassword(email, newPasswordHash) {
  try {
    let users = [];
    if (fs.existsSync(PERSISTENT_USERS_PATH)) {
      try {
        const content = fs.readFileSync(PERSISTENT_USERS_PATH, 'utf-8');
        users = JSON.parse(content || '[]');
      } catch (e) {
        users = [];
      }
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (user) {
      user.password_hash = newPasswordHash;
      user.updated_at = new Date().toISOString();
      try {
        fs.writeFileSync(PERSISTENT_USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
      } catch (e) {}

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          await vercelBlobPut('persistent_users.json', JSON.stringify(users, null, 2), {
            access: 'public',
            addRandomSuffix: false
          });
        } catch (blobErr) {
          console.warn('[DB] Notice: Could not upload updated password to Vercel Blob:', blobErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('[DB] Notice: Could not update password in persistent_users.json:', err.message);
  }
}

/**
 * Permanently removes a user from persistent_users.json and Vercel Blob cloud store.
 */
export async function deletePersistentUser(email) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const paths = [BUNDLED_USERS_PATH];
    if (PERSISTENT_USERS_PATH !== BUNDLED_USERS_PATH) {
      paths.push(PERSISTENT_USERS_PATH);
    }

    for (const p of paths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8');
          const users = JSON.parse(content || '[]');
          const filtered = users.filter((u) => u.email?.toLowerCase().trim() !== cleanEmail);
          fs.writeFileSync(p, JSON.stringify(filtered, null, 2), 'utf-8');
        } catch (e) {}
      }
    }

    if (process.env.BLOB_READ_WRITE_TOKEN && fs.existsSync(PERSISTENT_USERS_PATH)) {
      try {
        const users = JSON.parse(fs.readFileSync(PERSISTENT_USERS_PATH, 'utf-8') || '[]');
        await vercelBlobPut('persistent_users.json', JSON.stringify(users, null, 2), {
          access: 'public',
          addRandomSuffix: false
        });
      } catch (blobErr) {}
    }
  } catch (err) {
    console.warn('[DB] Notice: Could not delete from persistent_users.json:', err.message);
  }
}

// Initial sync on module load
syncPersistentUsers();

// Auto-seed demo and administrator accounts if not already present
try {
  const demoUser = db.prepare('SELECT id, role, is_active FROM users WHERE email = ?').get('demo@vegsense.io');
  if (!demoUser) {
    const demoPayload = {
      id: 'usr_demo_vegsense_001',
      name: 'Dr. Aris Thorne',
      email: 'demo@vegsense.io',
      password_hash: '$2b$10$QbNx7WCTa9dv5lYaSPRJ9eS3tnCETvBDkOjyX5LAENSAYMVza8.7q', // Password123
      role: 'ADMIN',
      is_active: 1,
      created_at: '2026-09-28 11:43:52',
      updated_at: '2026-09-28 11:43:52'
    };
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      demoPayload.id,
      demoPayload.name,
      demoPayload.email,
      demoPayload.password_hash,
      demoPayload.role,
      demoPayload.is_active,
      demoPayload.created_at,
      demoPayload.updated_at
    );
    savePersistentUser(demoPayload);
  } else {
    // Ensure demo account has ADMIN role and active status
    db.prepare("UPDATE users SET role = 'ADMIN', is_active = 1 WHERE email = 'demo@vegsense.io'").run();
  }

  // Also ensure dedicated admin account exists
  const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@vegsense.io');
  if (!adminUser) {
    const adminPayload = {
      id: 'usr_admin_vegsense_001',
      name: 'System Administrator',
      email: 'admin@vegsense.io',
      password_hash: '$2b$10$QbNx7WCTa9dv5lYaSPRJ9eS3tnCETvBDkOjyX5LAENSAYMVza8.7q', // Password123
      role: 'ADMIN',
      is_active: 1,
      created_at: '2026-09-28 10:00:00',
      updated_at: '2026-09-28 10:00:00'
    };
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminPayload.id,
      adminPayload.name,
      adminPayload.email,
      adminPayload.password_hash,
      adminPayload.role,
      adminPayload.is_active,
      adminPayload.created_at,
      adminPayload.updated_at
    );
    savePersistentUser(adminPayload);
  } else {
    db.prepare("UPDATE users SET role = 'ADMIN', is_active = 1 WHERE email = 'admin@vegsense.io'").run();
  }
} catch (seedErr) {
  console.warn('Notice: Could not seed admin users:', seedErr.message);
}

export default db;
