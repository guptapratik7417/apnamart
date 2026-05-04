import type { RowDataPacket } from "mysql2/promise";

import { getDatabaseRuntimeProperties } from "@/config/app-properties";
import { isSuperAdminSession } from "@/lib/admin-auth";
import {
  getDatabaseSetupMessage,
  getReadyDatabasePool,
  hasDatabaseConfig,
} from "@/lib/mariadb";

export const dynamic = "force-dynamic";

type TableRow = RowDataPacket & {
  table_name: string;
};

async function databaseStatus() {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const config = getDatabaseRuntimeProperties();
  if (!hasDatabaseConfig()) {
    return Response.json(
      {
        ready: false,
        autoSchema: config.autoSchema,
        error: getDatabaseSetupMessage(),
      },
      { status: 400 }
    );
  }

  try {
    const pool = await getReadyDatabasePool();
    if (!pool) throw new Error(getDatabaseSetupMessage());

    const [rows] = await pool.query<TableRow[]>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
       ORDER BY table_name`
    );

    return Response.json({
      ready: true,
      autoSchema: config.autoSchema,
      database: config.database,
      tables: rows.map((row) => row.table_name),
    });
  } catch (error) {
    return Response.json(
      {
        ready: false,
        autoSchema: config.autoSchema,
        database: config.database,
        error:
          error instanceof Error
            ? error.message
            : "Database schema initialization failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return databaseStatus();
}

export async function POST() {
  return databaseStatus();
}
