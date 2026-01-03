'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/constants'

interface VideoPlayerProps {
  videoUrl: string
  title: string
  lastPosition?: number
  onProgress?: (progressPercent: number, currentTime: number) => void
  onComplete?: () => void
}

export function VideoPlayer({
  videoUrl,
  title,
  lastPosition = 0,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)

  // Detectar si es un video de YouTube o Vimeo
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
  const isVimeo = videoUrl.includes('vimeo.com')
  const isEmbed = isYouTube || isVimeo

  // Obtener URL de embed
  const getEmbedUrl = () => {
    if (isYouTube) {
      const videoId = videoUrl.includes('youtu.be')
        ? videoUrl.split('/').pop()
        : new URLSearchParams(new URL(videoUrl).search).get('v')
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`
    }
    if (isVimeo) {
      const videoId = videoUrl.split('/').pop()
      return `https://player.vimeo.com/video/${videoId}?autoplay=0`
    }
    return videoUrl
  }

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const current = videoRef.current.currentTime
    const total = videoRef.current.duration
    const prog = (current / total) * 100

    setCurrentTime(current)
    setProgress(prog)

    // Reportar progreso cada 5 segundos
    if (onProgress && Math.floor(current) % 5 === 0) {
      onProgress(prog, current)
    }

    // Detectar completado (>= 90%)
    if (prog >= 90 && onComplete) {
      onComplete()
    }
  }, [onProgress, onComplete])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * duration
  }, [duration])

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
    // Restaurar posicion anterior
    if (lastPosition > 0) {
      videoRef.current.currentTime = lastPosition
    }
  }, [lastPosition])

  const handleRestart = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    setProgress(0)
    setCurrentTime(0)
  }, [])

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handlePlayPause()
      } else if (e.code === 'KeyM') {
        handleMute()
      } else if (e.code === 'KeyF') {
        handleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handlePlayPause, handleMute, handleFullscreen])

  // Si es embed (YouTube/Vimeo), usar iframe
  if (isEmbed) {
    return (
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={getEmbedUrl()}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  // Video HTML5 nativo
  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          onComplete?.()
        }}
        onClick={handlePlayPause}
      />

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Center play button */}
        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-indigo-600/90 flex items-center justify-center hover:bg-indigo-600 transition-colors"
          >
            <Play className="h-8 w-8 text-white ml-1" />
          </button>
        )}

        {/* Bottom controls */}
        <div className="p-4 space-y-2">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="h-1 bg-white/30 rounded-full cursor-pointer group/progress"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-indigo-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RotateCcw className="h-5 w-5 text-white" />
              </button>

              <button
                onClick={handleMute}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>

              <span className="text-sm text-white/80 ml-2">
                {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Maximize className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
