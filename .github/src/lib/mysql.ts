import mysql from 'mysql2/promise'

// Configurazione database MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'verifiche_condominiali',
  charset: 'utf8mb4',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}

// Pool di connessioni per performance migliori
let pool: mysql.Pool | null = null

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

// Connessione singola (se necessaria)
export const getConnection = async (): Promise<mysql.Connection> => {
  try {
    const connection = await mysql.createConnection(dbConfig)
    return connection
  } catch (error) {
    console.error('Errore connessione database:', error)
    throw new Error('Impossibile connettersi al database')
  }
}

// Esegue una query con il pool di connessioni
export const executeQuery = async <T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error('Errore esecuzione query:', error)
    console.error('Query:', query)
    console.error('Params:', params)
    throw error
  }
}

// Esegue una query e ritorna il primo risultato
export const executeQuerySingle = async <T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> => {
  const results = await executeQuery<T>(query, params)
  return results.length > 0 ? results[0] : null
}

// Esegue un INSERT e ritorna l'ID inserito
export const executeInsert = async (
  query: string, 
  params: any[] = []
): Promise<{ insertId: number; affectedRows: number }> => {
  try {
    const pool = getPool()
    const [result] = await pool.execute(query, params) as any
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    }
  } catch (error) {
    console.error('Errore INSERT:', error)
    console.error('Query:', query)
    console.error('Params:', params)
    throw error
  }
}

// Test connessione database
export const testConnection = async (): Promise<boolean> => {
  try {
    const pool = getPool()
    await pool.execute('SELECT 1')
    console.log('✅ Connessione database MySQL riuscita')
    return true
  } catch (error) {
    console.error('❌ Errore connessione database:', error)
    return false
  }
}

// Utility per generare UUID compatibili con MySQL
export const generateUUID = (): string => {
  return crypto.randomUUID()
}

// Utility per convertire campi snake_case in camelCase
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  
  if (obj !== null && typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        converted[camelKey] = toCamelCase(obj[key])
      }
    }
    return converted
  }
  
  return obj
}

// Utility per convertire campi camelCase in snake_case
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  
  if (obj !== null && typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        converted[snakeKey] = toSnakeCase(obj[key])
      }
    }
    return converted
  }
  
  return obj
}

// Chiude il pool di connessioni (per cleanup applicazione)
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
    console.log('Pool connessioni database chiuso')
  }
}

// Types per query results
export interface DatabaseResult {
  success: boolean
  data?: any
  error?: string
  affectedRows?: number
}

// Query builder helpers
export const buildWhereClause = (conditions: Record<string, any>): { where: string; params: any[] } => {
  const clauses: string[] = []
  const params: any[] = []
  
  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined && value !== null) {
      clauses.push(`${key} = ?`)
      params.push(value)
    }
  }
  
  return {
    where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  }
}

// Formatters per date MySQL
export const formatDateForMySQL = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export const currentMySQLTimestamp = (): string => {
  return formatDateForMySQL(new Date())
}