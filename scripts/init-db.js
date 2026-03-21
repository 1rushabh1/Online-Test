#!/usr/bin/env node
/**
 * Database initialization script (Neon compatible)
 * Run: node scripts/init-db.js
 */

require("dotenv").config({ path: ".env.local" });

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  console.log("🔌 Connecting to Neon PostgreSQL...");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // ✅ required for Neon
    },
    family: 4, // ✅ FIX: force IPv4 (prevents ETIMEDOUT)
    connectionTimeoutMillis: 10000, // ✅ avoid hanging forever
  });

  try {
    await client.connect();
    console.log("✅ Connected to database!");

    // ✅ Run schema
    console.log("📋 Running schema...");
    const schemaPath = path.join(__dirname, "schema.sql");

    if (!fs.existsSync(schemaPath)) {
      throw new Error("schema.sql file not found in scripts folder");
    }

    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    await client.query(schemaSQL);

    console.log("✅ Schema applied successfully.");

    // ✅ Create default admin
    const adminEmail = "admin@examportal.com";
    const adminPassword = "Admin@123";

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [adminEmail]
    );

    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 10);

      await client.query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4)`,
        ["Admin User", adminEmail, hash, "admin"]
      );

      console.log("");
      console.log("👤 Default admin user created:");
      console.log("   Email:    admin@examportal.com");
      console.log("   Password: Admin@123");
      console.log("   ⚠️  Change this password after first login!");
    } else {
      console.log("ℹ️ Admin user already exists, skipping.");
    }

    console.log("");
    console.log("🎉 Database initialization complete!");
    console.log("👉 Next step: npm run dev");

    await client.end();
  } catch (err) {
    console.error("❌ Full Error:");
    console.error(err);
    process.exit(1);
  }
}

initDb();