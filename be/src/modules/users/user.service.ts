import { pool } from "../../config/database";
import { User, CreateUserInput } from "./user.type";

export const getOrCreateUserByTelegramId = async (
  input: CreateUserInput
): Promise<User> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Check if user already exists
    const existing = await client.query(
      "SELECT * FROM users WHERE telegram_id = $1;",
      [input.telegram_id]
    );

    if (existing.rows.length > 0) {
      // Update first_name or username if changed
      const updated = await client.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             username = COALESCE($2, username),
             updated_at = NOW()
         WHERE telegram_id = $3
         RETURNING *;`,
        [input.first_name || null, input.username || null, input.telegram_id]
      );
      await client.query("COMMIT");
      return updated.rows[0];
    }

    // 2. Insert new user
    const newUser = await client.query(
      `INSERT INTO users (telegram_id, first_name, username, risk_profile, currency, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        input.telegram_id,
        input.first_name || null,
        input.username || null,
        input.risk_profile || "moderate",
        input.currency || "IDR",
        input.timezone || "Asia/Jakarta",
      ]
    );

    const user = newUser.rows[0];

    // 3. Create default primary portfolio for new user
    await client.query(
      `INSERT INTO portfolios (user_id, name, cash_balance)
       VALUES ($1, $2, $3);`,
      [user.id, "Portofolio Utama", 0]
    );

    await client.query("COMMIT");
    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getUserById = async (id: number): Promise<User | null> => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1;", [id]);
  return rows[0] || null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY id ASC;");
  return rows;
};

export const updateUserProfile = async (
  id: number,
  data: Partial<CreateUserInput>
): Promise<User | null> => {
  const { rows } = await pool.query(
    `UPDATE users
     SET risk_profile = COALESCE($1, risk_profile),
         currency = COALESCE($2, currency),
         timezone = COALESCE($3, timezone),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *;`,
    [data.risk_profile || null, data.currency || null, data.timezone || null, id]
  );
  return rows[0] || null;
};
