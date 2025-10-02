// Script di test per diagnosticare la connessione MySQL
import mysql from 'mysql2/promise'

const configs = [
  {
    name: 'Configurazione di default',
    config: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'verifiche_condominiali'
    }
  },
  {
    name: 'XAMPP MySQL',
    config: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
    }
  },
  {
    name: 'MAMP MySQL',
    config: {
      host: 'localhost',
      port: 8889,
      user: 'root',
      password: 'root',
    }
  },
  {
    name: 'Homebrew MySQL',
    config: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
    }
  }
]

async function testConnections() {
  console.log('🔍 Test connessioni MySQL...\n')
  
  for (const { name, config } of configs) {
    console.log(`📋 Testando: ${name}`)
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   User: ${config.user}`)
    
    try {
      const connection = await mysql.createConnection(config)
      console.log('   ✅ Connessione riuscita!')
      
      // Test semplice query
      const [rows] = await connection.execute('SELECT 1 as test')
      console.log('   ✅ Query di test funziona')
      
      // Controlla se il database esiste
      if (config.database) {
        try {
          await connection.execute(`USE ${config.database}`)
          console.log(`   ✅ Database '${config.database}' trovato`)
        } catch (e) {
          console.log(`   ⚠️  Database '${config.database}' non trovato`)
        }
      }
      
      await connection.end()
      console.log('   ✅ Questa configurazione funziona!\n')
      break
      
    } catch (error) {
      console.log(`   ❌ Errore: ${error.code || error.message}`)
      console.log('')
    }
  }
}

testConnections().catch(console.error)