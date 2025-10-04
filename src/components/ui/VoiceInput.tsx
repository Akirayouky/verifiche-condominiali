'use client'

import { useState, useEffect } from 'react'

interface VoiceInputProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  className?: string
}

/**
 * Componente Voice-to-Text con pulsante microfono
 * Usa Web Speech API per trascrizione real-time
 */
export default function VoiceInput({
  value,
  onChange,
  placeholder = 'Scrivi o parla...',
  className = ''
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Verifica supporto Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        setIsSupported(true)
        
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true // Continua ad ascoltare
        recognitionInstance.interimResults = true // Mostra risultati parziali
        recognitionInstance.lang = 'it-IT' // Italiano
        recognitionInstance.maxAlternatives = 1

        // Evento: risultato riconosciuto
        recognitionInstance.onresult = (event: any) => {
          let transcript = ''
          
          // Combina tutti i risultati
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              transcript += result[0].transcript + ' '
            }
          }

          if (transcript) {
            // Aggiungi testo al valore esistente
            const newText = value ? `${value} ${transcript}`.trim() : transcript.trim()
            onChange(newText)
          }
        }

        // Evento: errore
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
          if (event.error === 'not-allowed') {
            alert('⚠️ Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.')
          } else if (event.error === 'no-speech') {
            // Nessun parlato rilevato, continua ad ascoltare
            console.log('No speech detected, continue listening...')
          }
        }

        // Evento: fine riconoscimento
        recognitionInstance.onend = () => {
          if (isListening) {
            // Se stava ascoltando, riavvia automaticamente
            try {
              recognitionInstance.start()
            } catch (e) {
              console.log('Recognition already started')
            }
          } else {
            setIsListening(false)
          }
        }

        setRecognition(recognitionInstance)
      } else {
        console.warn('Web Speech API not supported')
      }
    }

    return () => {
      // Cleanup: ferma riconoscimento quando componente viene smontato
      if (recognition) {
        try {
          recognition.stop()
        } catch (e) {
          // Ignora errori se già fermato
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognition) return

    if (isListening) {
      // Ferma ascolto
      recognition.stop()
      setIsListening(false)
    } else {
      // Inizia ascolto
      try {
        recognition.start()
        setIsListening(true)
      } catch (error) {
        console.error('Error starting recognition:', error)
      }
    }
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${isSupported ? 'pr-14' : ''}`}
        rows={4}
      />
      
      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute right-3 top-3 p-2 rounded-full transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-lg'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          title={isListening ? 'Ferma registrazione' : 'Inizia registrazione vocale'}
        >
          {isListening ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              {/* Microfono con onda sonora */}
              <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              {/* Microfono normale */}
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )}
      
      {!isSupported && (
        <div className="absolute right-3 top-3 text-gray-400 text-sm">
          ⚠️ Voice input not supported
        </div>
      )}
    </div>
  )
}
