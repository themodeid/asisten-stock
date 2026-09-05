import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { ENV } from "../config/env";

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
});

const migrationsPath = path.join(__dirname, "migrations");

const ensureMigrationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};

const getAppliedMigrations = async (): Promise<string[]> => {
  const { rows } = await pool.query(
    "SELECT name FROM migrations ORDER BY id ASC;"
  );
  return rows.map((row) => row.name);
};

export const runMigrations = async () => {
  console.log("🚀 Checking database migrations...");
  await ensureMigrationsTable();
  const appliedMigrations = await getAppliedMigrations();

  if (!fs.existsSync(migrationsPath)) {
    fs.mkdirSync(migrationsPath, { recursive: true });
  }

  const files = fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith("_up.sql"))
    .sort();

  if (files.length === 0) {
    console.log("ℹ️ No migrations found.");
    return;
  }

  let migratedCount = 0;

  for (const file of files) {
    const migrationName = file.replace("_up.sql", "");

    if (!appliedMigrations.includes(migrationName)) {
      console.log(`⏳ Applying migration: ${migrationName}...`);
      const rawSql = fs.readFileSync(path.join(migrationsPath, file), "utf-8");
      const sql = rawSql.replace(/^\uFEFF/, "");

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [
          migrationName,
        ]);
        await client.query("COMMIT");
        console.log(`✅ Applied: ${migrationName}`);
        migratedCount++;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`❌ Migration failed: ${migrationName}`, error);
        throw error;
      } finally {
        client.release();
      }
    }
  }

  if (migratedCount === 0) {
    console.log("👍 All migrations are up to date.");
  } else {
    console.log(`🎉 Successfully applied ${migratedCount} migration(s).`);
  }
};

export const rollbackMigration = async () => {
  await ensureMigrationsTable();
  const appliedMigrations = await getAppliedMigrations();

  if (appliedMigrations.length === 0) {
    console.log("ℹ️ No migrations to rollback.");
    return;
  }

  const lastMigration = appliedMigrations[appliedMigrations.length - 1];
  const file = `${lastMigration}_down.sql`;
  const filePath = path.join(migrationsPath, file);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Rollback file not found: ${file}`);
    return;
  }

  console.log(`⏳ Rolling back migration: ${lastMigration}...`);
  const rawSql = fs.readFileSync(filePath, "utf-8");
  const sql = rawSql.replace(/^\uFEFF/, "");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("DELETE FROM migrations WHERE name = $1", [lastMigration]);
    await client.query("COMMIT");
    console.log(`✅ Rollback successful: ${lastMigration}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`❌ Rollback failed: ${lastMigration}`, error);
    throw error;
  } finally {
    client.release();
  }
};
