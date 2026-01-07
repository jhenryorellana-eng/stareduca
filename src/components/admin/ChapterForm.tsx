'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Video, Clock, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChapterFormProps {
  courseId: string
  chapter?: {
    id: string
    title: string
    description: string | null
    video_url: string | null
    video_duration_seconds: number
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
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(chapter?.video_duration_seconds || 0)

  const videoInputRef = useRef<HTMLInputElement>(null)

  // Solo crear preview local, no subir todavia
  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limpiar preview anterior si existe
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }

    // Crear preview local
    const objectUrl = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoPreview(objectUrl)
    setVideoUrl('') // Limpiar URL anterior si existe

    // Detectar duracion del video
    const videoElement = document.createElement('video')
    videoElement.preload = 'metadata'
    videoElement.src = objectUrl

    videoElement.onloadedmetadata = () => {
      setVideoDuration(Math.round(videoElement.duration))
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
    setVideoFile(null)
    setVideoPreview(null)
    setVideoUrl('')
    setVideoDuration(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let finalVideoUrl = videoUrl

      // Subir video si hay archivo nuevo
      if (videoFile) {
        const formData = new FormData()
        formData.append('file', videoFile)
        formData.append('folder', 'course-videos')

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()

        if (uploadData.success) {
          finalVideoUrl = uploadData.url
        } else {
          throw new Error(uploadData.error || 'Error al subir video')
        }
      }

      const body = {
        title,
        description: description || null,
        video_url: finalVideoUrl || null,
        video_duration_seconds: videoDuration
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

      // Limpiar preview
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview)
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

            <div className="aspect-video rounded-lg bg-slate-700 overflow-hidden relative">
              {(videoPreview || videoUrl) ? (
                <>
                  <video src={videoPreview || videoUrl} controls className="w-full h-full" />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-600/50 transition-colors">
                  <Upload className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-400">Subir video</span>
                  <span className="text-xs text-slate-500 mt-1">MP4, WebM, MOV hasta 50MB</span>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {!videoUrl && !videoPreview && (
              <p className="text-xs text-slate-500 text-center">
                Haz clic en el area para subir un video. La duracion se detectara automaticamente.
              </p>
            )}

            {videoDuration > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" />
                <span>Duracion: {Math.floor(videoDuration / 60)} min {videoDuration % 60} seg</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Note about materials */}
          {!isEditing && (
            <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
              <p className="text-sm text-indigo-300">
                Despues de crear el capitulo podras agregar materiales complementarios (PDFs, textos, enlaces).
              </p>
            </div>
          )}

          {isEditing && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-sm text-slate-400">
                Puedes agregar materiales complementarios en la seccion de materiales despues de guardar.
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

