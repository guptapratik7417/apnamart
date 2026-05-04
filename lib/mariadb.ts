import mysql, {
  type Pool,
  type PoolConnection,
  type QueryResult,
  type ResultSetHeader,
} from "mysql2/promise";

import { appProperties, getDatabaseRuntimeProperties } from "@/config/app-properties";
import { ensureDatabaseSchema } from "@/lib/database-schema";

export type QueryValue = string | number | boolean | null | Date;

declare global {
  var apnamartMariaDbPool: Pool | undefined;
  var apnamartMariaDbSchemaReady: Promise<void> | undefined;
}

export function hasDatabaseConfig() {
  const config = getDatabaseRuntimeProperties();
  return Boolean(config.host && config.user && config.database);
}

export function getDatabaseSetupMessage() {
  return appProperties.database.setupMessage;
}

export function getDatabasePool() {
  if (!hasDatabaseConfig()) return null;

  if (!globalThis.apnamartMariaDbPool) {
    const config = getDatabaseRuntimeProperties();
    globalThis.apnamartMariaDbPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit,
      dateStrings: true,
      decimalNumbers: true,
    });
  }

  return globalThis.apnamartMariaDbPool;
}

export async function getReadyDatabasePool() {
  const pool = getDatabasePool();
  if (!pool) return null;

  const config = getDatabaseRuntimeProperties();
  if (!config.autoSchema) return pool;

  if (!globalThis.apnamartMariaDbSchemaReady) {
    globalThis.apnamartMariaDbSchemaReady = ensureDatabaseSchema(pool).catch(
      (error) => {
        globalThis.apnamartMariaDbSchemaReady = undefined;
        throw error;
      }
    );
  }

  await globalThis.apnamartMariaDbSchemaReady;
  return pool;
}

export async function queryRows<T extends QueryResult>(
  sql: string,
  params: QueryValue[] = []
) {
  const pool = await getReadyDatabasePool();
  if (!pool) throw new Error(getDatabaseSetupMessage());

  const [rows] = await pool.query<T>(sql, params);
  return rows;
}

export async function executeQuery(
  sql: string,
  params: QueryValue[] = []
) {
  const pool = await getReadyDatabasePool();
  if (!pool) throw new Error(getDatabaseSetupMessage());

  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
) {
  const pool = await getReadyDatabasePool();
  if (!pool) throw new Error(getDatabaseSetupMessage());

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
