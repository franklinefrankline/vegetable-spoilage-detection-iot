import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
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

// Migration: Ensure sensor_readings has light columns (Section 14)
const sensorReadingColumns = [
  { name: 'light_level', type: 'REAL DEFAULT 420' },
  { name: 'light_classification', type: 'TEXT DEFAULT "NORMAL LIGHT"' },
  { name: 'light_risk', type: 'INTEGER DEFAULT 10' }
];

for (const col of sensorReadingColumns) {
  try {
    db.exec(`ALTER TABLE sensor_readings ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column already exists, safe to ignore
  }
}

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
      INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        password_hash = excluded.password_hash,
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
              insertStmt.run(
                u.id,
                u.name,
                cleanEmail,
                u.password_hash,
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
                insertStmt.run(
                  u.id,
                  u.name,
                  cleanEmail,
                  u.password_hash,
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
    const existingIndex = users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);

    const record = {
      id: user.id,
      name: user.name,
      email: cleanEmail,
      password_hash: user.password_hash,
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

// Initial sync on module load
syncPersistentUsers();

// Auto-seed demo account if not already present
try {
  const demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@vegsense.io');
  if (!demoUser) {
    const demoPayload = {
      id: 'usr_demo_vegsense_001',
      name: 'Dr. Aris Thorne',
      email: 'demo@vegsense.io',
      password_hash: '$2b$10$p7J1xm5RnPLX66VEJu7F8Oy1AzvRSvYFxnNY3xG3oSUBFTItXkw/O',
      created_at: '2026-09-28 11:43:52',
      updated_at: '2026-09-28 11:43:52'
    };
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      demoPayload.id,
      demoPayload.name,
      demoPayload.email,
      demoPayload.password_hash,
      demoPayload.created_at,
      demoPayload.updated_at
    );
    savePersistentUser(demoPayload);
  }
} catch (seedErr) {
  console.warn('Notice: Could not seed demo user:', seedErr.message);
}

export default db;
