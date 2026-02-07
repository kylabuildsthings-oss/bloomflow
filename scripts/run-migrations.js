#!/usr/bin/env node
/**
 * Run Supabase migrations locally.
 * Requires DATABASE_URL in .env.local (Supabase Dashboard > Project Settings > Database > Connection string).
 */
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, "");
        if (key && val) process.env[key] = val;
      }
    });
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(`
Missing DATABASE_URL in .env.local

To get it:
1. Open Supabase Dashboard → your project → Project Settings → Database
2. Copy the "Connection string" (URI format)
3. Replace [YOUR-PASSWORD] with your database password (reset it if needed)
4. Add to .env.local: DATABASE_URL=postgresql://postgres:[password]@db.wdmjeendewogehktmpqh.supabase.co:5432/postgres
`);
  process.exit(1);
}

async function run() {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`Running ${file}...`);
      await client.query(sql);
      console.log(`  ✓ ${file}`);
    }
    console.log("\nMigrations complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
