import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 as ok, NOW() as now");
    console.log("✅ db connected:", res.rows[0]);
  } catch (err) {
    console.error("❌ db connect failed:", err);
  } finally {
    await client.end();
  }
}

main();
