/**
 * Offline Storage Manager using IndexedDB
 * iPad-friendly with manual sync fallback
 */

const DB_NAME = 'CondominialePWA'
const DB_VERSION = 1
const STORES = {
  LAVORAZIONI: 'lavorazioni_offline',
  FOTO: 'foto_offline',
  SYNC_QUEUE: 'sync_queue'
}

export interface OfflineLavorazione {
  id: string
  data: any
  timestamp: number
  synced: boolean
}

export interface OfflineFoto {
  id: string
  lavorazioneId: string
  base64: string
  timestamp: number
  synced: boolean
  geo?: any
}

export interface SyncQueueItem {
  id: string
  type: 'lavorazione' | 'foto'
  action: 'create' | 'update'
  data: any
  timestamp: number
  retries: number
}

class OfflineManager {
  private db: IDBDatabase | null = null

  /**
   * Inizializza IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result

        // Store lavorazioni offline
        if (!db.objectStoreNames.contains(STORES.LAVORAZIONI)) {
          const lavorazioniStore = db.createObjectStore(STORES.LAVORAZIONI, { keyPath: 'id' })
          lavorazioniStore.createIndex('timestamp', 'timestamp', { unique: false })
          lavorazioniStore.createIndex('synced', 'synced', { unique: false })
        }

        // Store foto offline
        if (!db.objectStoreNames.contains(STORES.FOTO)) {
          const fotoStore = db.createObjectStore(STORES.FOTO, { keyPath: 'id' })
          fotoStore.createIndex('lavorazioneId', 'lavorazioneId', { unique: false })
          fotoStore.createIndex('synced', 'synced', { unique: false })
        }

        // Store coda sincronizzazione
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        console.log('📦 IndexedDB stores created')
      }
    })
  }

  /**
   * Salva lavorazione offline
   */
  async saveLavorazione(lavorazione: OfflineLavorazione): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.LAVORAZIONI], 'readwrite')
      const store = transaction.objectStore(STORES.LAVORAZIONI)
      const request = store.put(lavorazione)

      request.onsuccess = () => {
        console.log('💾 Lavorazione salvata offline:', lavorazione.id)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Ottieni lavorazioni offline non sincronizzate
   */
  async getUnsyncedLavorazioni(): Promise<OfflineLavorazione[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.LAVORAZIONI], 'readonly')
      const store = transaction.objectStore(STORES.LAVORAZIONI)
      const index = store.index('synced')
      const request = index.openCursor(IDBKeyRange.only(false))
      
      const results: OfflineLavorazione[] = []
      
      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Salva foto offline
   */
  async saveFoto(foto: OfflineFoto): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.FOTO], 'readwrite')
      const store = transaction.objectStore(STORES.FOTO)
      const request = store.put(foto)

      request.onsuccess = () => {
        console.log('📸 Foto salvata offline:', foto.id)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Ottieni foto offline non sincronizzate
   */
  async getUnsyncedFoto(): Promise<OfflineFoto[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.FOTO], 'readonly')
      const store = transaction.objectStore(STORES.FOTO)
      const index = store.index('synced')
      const request = index.openCursor(IDBKeyRange.only(false))
      
      const results: OfflineFoto[] = []
      
      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Segna elemento come sincronizzato
   */
  async markAsSynced(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        const data = request.result
        if (data) {
          data.synced = true
          store.put(data)
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Conta elementi non sincronizzati
   */
  async countUnsynced(): Promise<{ lavorazioni: number; foto: number }> {
    const lavorazioni = await this.getUnsyncedLavorazioni()
    const foto = await this.getUnsyncedFoto()
    
    return {
      lavorazioni: lavorazioni.length,
      foto: foto.length
    }
  }

  /**
   * Verifica se online
   */
  isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Sincronizza dati offline con server
   */
  async sync(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline()) {
      throw new Error('Nessuna connessione internet')
    }

    let success = 0
    let failed = 0

    // Sincronizza lavorazioni
    const lavorazioni = await this.getUnsyncedLavorazioni()
    for (const lav of lavorazioni) {
      try {
        const response = await fetch('/api/lavorazioni', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lav.data)
        })

        if (response.ok) {
          await this.markAsSynced(STORES.LAVORAZIONI, lav.id)
          success++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Errore sync lavorazione:', error)
        failed++
      }
    }

    // Sincronizza foto
    const foto = await this.getUnsyncedFoto()
    for (const f of foto) {
      try {
        const response = await fetch('/api/upload-foto-vercel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            foto: [f.base64],
            lavorazioneId: f.lavorazioneId,
            geo: f.geo
          })
        })

        if (response.ok) {
          await this.markAsSynced(STORES.FOTO, f.id)
          success++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Errore sync foto:', error)
        failed++
      }
    }

    console.log(`🔄 Sync completato: ${success} successi, ${failed} falliti`)
    return { success, failed }
  }

  /**
   * Pulisci dati sincronizzati più vecchi di X giorni
   */
  async cleanup(daysOld: number = 7): Promise<number> {
    if (!this.db) await this.init()

    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
    let deleted = 0

    // Pulisci lavorazioni
    const lavorazioni = await this.getUnsyncedLavorazioni()
    for (const lav of lavorazioni) {
      if (lav.synced && lav.timestamp < cutoffTime) {
        const transaction = this.db!.transaction([STORES.LAVORAZIONI], 'readwrite')
        const store = transaction.objectStore(STORES.LAVORAZIONI)
        store.delete(lav.id)
        deleted++
      }
    }

    console.log(`🧹 Pulizia completata: ${deleted} elementi rimossi`)
    return deleted
  }
}

// Esporta istanza singleton
export const offlineManager = new OfflineManager()
