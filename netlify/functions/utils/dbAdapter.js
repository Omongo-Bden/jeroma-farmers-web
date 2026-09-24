/**
 * Jeroma Farmers Unified Database Adapter
 * Seamlessly interfaces with PostgreSQL/Supabase when DATABASE_URL is set,
 * with graceful fallback to serverDb.js (file-backed/in-memory) for zero-config deployments.
 */

const serverDb = require('./serverDb');

const hasPgConfig = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);

let pgPool = null;
if (hasPgConfig) {
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    });
    console.log('[DbAdapter] Connected to external PostgreSQL/Supabase cluster.');
  } catch (err) {
    console.warn('[DbAdapter] PostgreSQL client not available or initialization failed. Falling back to local storage:', err.message);
  }
}

module.exports = {
  isPostgresActive: () => Boolean(pgPool),

  // Fallback / Unified interface matching serverDb.js API
  getCooperatives: async () => {
    if (pgPool) {
      try {
        const { rows } = await pgPool.query('SELECT * FROM cooperatives ORDER BY created_at DESC');
        return rows.map(r => ({
          id: r.id,
          code: r.code,
          name: r.name,
          district: r.district,
          subcounty: r.subcounty,
          contactPerson: r.contact_person,
          phone: r.phone,
          membersCount: r.registered_farmers,
          cropsSpecialization: r.crops_specialization || [],
          status: r.status
        }));
      } catch (e) {
        console.error('[DbAdapter] Error querying Postgres cooperatives:', e.message);
      }
    }
    return serverDb.getCooperatives();
  },

  saveCooperative: async (coop) => {
    if (pgPool) {
      try {
        const query = `
          INSERT INTO cooperatives (code, name, district, subcounty, contact_person, phone, registered_farmers, crops_specialization, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            district = EXCLUDED.district,
            subcounty = EXCLUDED.subcounty,
            contact_person = EXCLUDED.contact_person,
            phone = EXCLUDED.phone,
            registered_farmers = EXCLUDED.registered_farmers,
            crops_specialization = EXCLUDED.crops_specialization,
            status = EXCLUDED.status,
            updated_at = NOW()
          RETURNING *;
        `;
        const values = [
          coop.code,
          coop.name,
          coop.district,
          coop.subcounty || '',
          coop.contactPerson || '',
          coop.phone || '',
          coop.membersCount || 0,
          JSON.stringify(coop.cropsSpecialization || []),
          coop.status || 'Active'
        ];
        const { rows } = await pgPool.query(query, values);
        return rows[0];
      } catch (e) {
        console.error('[DbAdapter] Error saving cooperative to Postgres:', e.message);
      }
    }
    return serverDb.saveCooperative(coop);
  },

  // Proxy remaining methods to local database engine
  ...serverDb
};
