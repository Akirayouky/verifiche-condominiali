'use client'

import { useEffect, useState } from 'react'

interface LogEntry {
  timestamp: string
  type: 'log' | 'error' | 'warn'
  message: string
  data?: any
}

export default function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)

  useEffect(() => {
    // Intercetta console.log, console.error, console.warn
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args: any[]) => {
      originalLog(...args)
      addLog('log', args)
    }

    console.error = (...args: any[]) => {
      originalError(...args)
      addLog('error', args)
    }

    console.warn = (...args: any[]) => {
      originalWarn(...args)
      addLog('warn', args)
    }

    // Mostra panel automaticamente se ci sono emoji debug (📄 🗺️ ✅ ❌)
    const checkForDebugEmoji = setInterval(() => {
      const hasDebugLogs = logs.some(log => 
        log.message.includes('📄') || 
        log.message.includes('🗺️') || 
        log.message.includes('✅') || 
        log.message.includes('❌')
      )
      if (hasDebugLogs && !isVisible) {
        setIsVisible(true)
        setIsMinimized(false)
      }
    }, 1000)

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      clearInterval(checkForDebugEmoji)
    }
  }, [logs, isVisible])

  const addLog = (type: LogEntry['type'], args: any[]) => {
    const timestamp = new Date().toLocaleTimeString('it-IT')
    let message = ''
    let data = undefined

    if (args.length === 1 && typeof args[0] === 'string') {
      message = args[0]
    } else if (args.length > 1) {
      message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0])
      data = args.slice(1)
    } else {
      message = JSON.stringify(args[0])
    }

    setLogs(prev => [...prev.slice(-50), { timestamp, type, message, data }])
  }

  const getTypeColor = (type: LogEntry['type']) => {
    switch(type) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-700 bg-yellow-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const getTypeIcon = (type: LogEntry['type']) => {
    switch(type) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      default: return 'ℹ️'
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Mostra Debug Panel"
      >
        🐛 Debug
      </button>
    )
  }

  return (
    <div 
      className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'inset-4'} z-50 bg-white border-2 border-gray-300 rounded-lg shadow-2xl transition-all duration-300`}
      style={{ maxHeight: isMinimized ? '60px' : 'calc(100vh - 2rem)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐛</span>
          <span className="font-semibold">Debug Panel</span>
          <span className="text-xs text-gray-300">({logs.length} logs)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
            title="Cancella tutti i log"
          >
            🗑️ Clear
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            ✖️
          </button>
        </div>
      </div>

      {/* Logs Container */}
      {!isMinimized && (
        <div className="overflow-auto p-4 space-y-2" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          {logs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              Nessun log ancora. Genera un PDF per vedere i debug logs...
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getTypeColor(log.type)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getTypeIcon(log.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{log.timestamp}</span>
                      <span className="text-xs font-semibold uppercase">{log.type}</span>
                    </div>
                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                      {log.message}
                    </div>
                    {log.data && log.data.length > 0 && (
                      <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
