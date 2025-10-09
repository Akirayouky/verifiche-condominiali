'use client'

import { useState, useEffect, useRef } from 'react'

interface VideoIntroProps {
  onComplete: () => void
}

export default function VideoIntro({ onComplete }: VideoIntroProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Auto-play quando il componente si monta
      video.play().then(() => {
        setIsPlaying(true)
      }).catch((error) => {
        console.log('Auto-play prevented:', error)
        // Se auto-play è bloccato, mostra i controlli
        setShowControls(true)
      })
    }
  }, [])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video) {
      setCurrentTime(video.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (video) {
      setDuration(video.duration)
    }
  }

  const handleVideoEnd = () => {
    setIsPlaying(false)
    // Attendi 1 secondo e poi chiudi
    setTimeout(() => {
      onComplete()
    }, 1000)
  }

  const handleSkip = () => {
    onComplete()
  }

  const handlePlayPause = () => {
    const video = videoRef.current
    if (video) {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        video.play()
        setIsPlaying(true)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center">
        
        {/* Video Container */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            className="w-full h-full max-w-4xl max-h-[80vh] object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnd}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            preload="auto"
          >
            <source src="/videos/intro.mp4" type="video/mp4" />
            <p className="text-white p-4">
              Il tuo browser non supporta i video HTML5. 
              <a href="/videos/intro.mp4" className="underline ml-1">
                Scarica il video
              </a>
            </p>
          </video>

          {/* Overlay Controls */}
          {showControls && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30">
              
              {/* Header con titolo e Skip */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-white text-2xl font-bold mb-2">
                    🎬 Benvenuto in Verifiche Condominiali
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Un breve video per iniziare
                  </p>
                </div>
                
                <button
                  onClick={handleSkip}
                  className="bg-gray-800/80 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
                >
                  ⏭️ Salta Intro
                </button>
              </div>

              {/* Play/Pause centrale */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-all backdrop-blur-sm"
                >
                  {isPlaying ? (
                    <div className="text-white text-3xl">⏸️</div>
                  ) : (
                    <div className="text-white text-3xl">▶️</div>
                  )}
                </button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="bg-white/20 h-1 rounded-full overflow-hidden backdrop-blur-sm relative">
                    <div 
                      className={`bg-blue-500 h-full transition-all duration-300 absolute left-0 top-0`}
                      ref={(el) => {
                        if (el) {
                          el.style.width = `${progressPercentage}%`
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-white text-xs mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePlayPause}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {isPlaying ? '⏸️ Pausa' : '▶️ Play'}
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSkip}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    ✅ Continua all'App
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Controlli nascosti/mostrati al hover */}
          <div 
            className="absolute inset-0"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(isPlaying ? false : true)}
          />
        </div>

        {/* Background Click to Skip */}
        <div 
          className="absolute inset-0 -z-10"
          onClick={handleSkip}
        />
      </div>
    </div>
  )
}