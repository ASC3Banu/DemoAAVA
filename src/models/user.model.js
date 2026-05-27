const { pgPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const secretsManager = require('../config/secrets');

class UserModel {
  async create(userData) {
    const id = uuidv4();
    const hashedPassword = secretsManager.hashPassword(userData.password);
    
    const query = `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        phone, company, roles, permissions, tier, is_active,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, email, first_name, last_name, phone, company, roles, permissions, tier, is_active, created_at
    `;

    const values = [
      id,
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name,
      userData.phone || null,
      userData.company || null,
      JSON.stringify(userData.roles || ['user']),
      JSON.stringify(userData.permissions || []),
      userData.tier || 'free',
      true
    ];

    const result = await pgPool.query(query, values);
    return this.formatUser(result.rows[0]);
  }

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pgPool.query(query, [id]);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pgPool.query(query, [email]);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (['roles', 'permissions'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(updateData[key]));
      } else if (key === 'password') {
        fields.push(`password_hash = $${paramCount}`);
        values.push(secretsManager.hashPassword(updateData[key]));
      } else {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
      paramCount++;
    });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone, company, roles, permissions, tier, is_active, created_at, updated_at
    `;

    const result = await pgPool.query(query, values);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  async verifyPassword(email, password) {
    const query = 'SELECT id, password_hash FROM users WHERE email = $1 AND is_active = true';
    const result = await pgPool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValid = secretsManager.verifyPassword(password, user.password_hash);
    
    return isValid ? user.id : null;
  }

  async findAll(filters = {}, pagination = {}) {
    let query = 'SELECT id, email, first_name, last_name, phone, company, roles, permissions, tier, is_active, created_at FROM users WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.is_active);
      paramCount++;
    }

    if (filters.tier) {
      query += ` AND tier = $${paramCount}`;
      values.push(filters.tier);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (pagination.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(pagination.limit);
      paramCount++;
    }

    if (pagination.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(pagination.offset);
    }

    const result = await pgPool.query(query, values);
    return result.rows.map(row => this.formatUser(row));
  }

  formatUser(row) {
    return {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      company: row.company,
      roles: typeof row.roles === 'string' ? JSON.parse(row.roles) : row.roles,
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
      tier: row.tier,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

module.exports = new UserModel();