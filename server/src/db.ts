import { Pool } from "pg";
import dotenv from "dotenv";

// 加载.env环境变量
dotenv.config();

// 创建连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // 必须加，否则Supabase SSL连接报错
  },
});

// 测试连接（启动时自动验证）
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("数据库连接失败:", err);
  } else {
    console.log("数据库连接成功:", res.rows[0].now);
  }
});

export default pool;
