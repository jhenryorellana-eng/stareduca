'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Video, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface ChapterFormProps {
  courseId: string
  chapter?: {
    id: string
    title: string
    description: string | null
    video_url: string | null
    video_duration_seconds: number
    is_free_preview: boolean
  }
  onSuccess?: () => void
}

export function ChapterForm({ courseId, chapter, onSuccess }: ChapterFormProps) {
  const router = useRouter()
  const isEditing = !!chapter

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(chapter?.title || '')
  const [description, setDescription] = useState(chapter?.description || '')
  const [videoUrl, setVideoUrl] = useState(chapter?.video_url || '')
  const [videoDuration, setVideoDuration] = useState(chapter?.video_duration_seconds || 0)
  const [isFreePreview, setIsFreePreview] = useState(chapter?.is_free_preview || false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const body = {
        title,
        description: description || null,
        video_url: videoUrl || null,
        video_duration_seconds: videoDuration,
        is_free_preview: isFreePreview
      }

      const url = isEditing
        ? `/api/admin/courses/${courseId}/chapters/${chapter.id}`
        : `/api/admin/courses/${courseId}/chapters`

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar')
      }

      if (onSuccess) {
        onSuccess()
      } else if (!isEditing) {
        // Si es nuevo capitulo, ir a editar para agregar materiales
        router.push(`/admin/courses/${courseId}/chapters/${data.chapter.id}`)
      } else {
        router.push(`/admin/courses/${courseId}/chapters`)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const formatDurationInput = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return { mins, secs }
  }

  const handleDurationChange = (mins: number, secs: number) => {
    setVideoDuration(mins * 60 + secs)
  }

  const { mins, secs } = formatDurationInput(videoDuration)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Informacion del capitulo</h3>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Titulo *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Introduccion al Marketing Digital"
                required
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Descripcion</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el contenido de este capitulo..."
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Video */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Video</h3>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">URL del video</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Soporta YouTube, Vimeo o URLs directas de video
              </p>
            </div>

            {videoUrl && (
              <div className="aspect-video rounded-lg bg-slate-700 overflow-hidden">
                {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={getYouTubeEmbedUrl(videoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : videoUrl.includes('vimeo') ? (
                  <iframe
                    src={getVimeoEmbedUrl(videoUrl)}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={videoUrl} controls className="w-full h-full" />
                )}
              </div>
            )}

            <div>
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duracion del video
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={mins}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0, secs)}
                  min={0}
                  className="w-20 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-center outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400">min</span>
                <input
                  type="number"
                  value={secs}
                  onChange={(e) => handleDurationChange(mins, parseInt(e.target.value) || 0)}
                  min={0}
                  max={59}
                  className="w-20 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-center outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400">seg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Configuracion</h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Preview gratuito</p>
                <p className="text-xs text-slate-400">Visible sin suscripcion</p>
              </div>
              <Switch
                checked={isFreePreview}
                onCheckedChange={setIsFreePreview}
              />
            </div>
          </div>

          {/* Note about materials */}
          {!isEditing && (
            <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
              <p className="text-sm text-indigo-300">
                Despues de crear el capitulo podras agregar materiales complementarios (PDFs, textos, enlaces).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/courses/${courseId}/chapters`)}
          className="border-slate-700 text-slate-300"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditing ? 'Guardar cambios' : 'Crear capitulo'}
        </Button>
      </div>
    </form>
  )
}

// Helper functions
function getYouTubeEmbedUrl(url: string): string {
  let videoId = ''
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0]
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1])
    videoId = urlParams.get('v') || ''
  }
  return `https://www.youtube.com/embed/${videoId}`
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.split('/').pop()?.split('?')[0] || ''
  return `https://player.vimeo.com/video/${videoId}`
}
