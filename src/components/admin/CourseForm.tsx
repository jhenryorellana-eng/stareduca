'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Image as ImageIcon, Upload, X, Video, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface CourseFormProps {
  course?: {
    id: string
    title: string
    description: string | null
    short_description: string | null
    thumbnail_url: string | null
    presentation_video_url: string | null
    instructor_name: string | null
    instructor_bio: string | null
    category: string | null
    tags: string[]
    is_published: boolean
  }
  onSuccess?: () => void
}

const CATEGORIES = [
  'Negocios',
  'Marketing',
  'Finanzas',
  'Desarrollo Personal',
  'Liderazgo',
  'Ventas',
  'Emprendimiento',
  'Tecnologia'
]

export function CourseForm({ course, onSuccess }: CourseFormProps) {
  const router = useRouter()
  const isEditing = !!course

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(course?.title || '')
  const [description, setDescription] = useState(course?.description || '')
  const [shortDescription, setShortDescription] = useState(course?.short_description || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url || '')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [instructorName, setInstructorName] = useState(course?.instructor_name || '')
  const [instructorBio, setInstructorBio] = useState(course?.instructor_bio || '')
  const [category, setCategory] = useState(course?.category || '')
  const [tagsInput, setTagsInput] = useState(course?.tags?.join(', ') || '')
  const [isPublished, setIsPublished] = useState(course?.is_published || false)

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Estado para video de presentación
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState(course?.presentation_video_url || '')
  const [originalVideoUrl] = useState(course?.presentation_video_url || '')

  // Solo crear preview local, no subir todavia
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
    setThumbnailUrl('') // Limpiar URL anterior si existe

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const handleRemoveThumbnail = () => {
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview)
    }
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setThumbnailUrl('')
  }

  // Handlers para video de presentación
  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('El video no puede superar 50MB')
      return
    }

    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
    setVideoUrl('') // Limpiar URL anterior

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
  }

  // Helper para eliminar archivo del storage
  const deleteFromStorage = async (url: string) => {
    if (!url) return
    try {
      // Extraer bucket y path del URL
      const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
      if (match) {
        const [, bucket, path] = match
        await fetch(`/api/admin/upload?path=${encodeURIComponent(path)}&folder=${bucket}`, {
          method: 'DELETE'
        })
      }
    } catch (err) {
      console.error('Error deleting file from storage:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let finalThumbnailUrl = thumbnailUrl

      // Subir thumbnail si hay archivo nuevo
      if (thumbnailFile) {
        const formData = new FormData()
        formData.append('file', thumbnailFile)
        formData.append('folder', 'course-thumbnails')

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()

        if (uploadData.success) {
          finalThumbnailUrl = uploadData.url
        } else {
          throw new Error(uploadData.error || 'Error al subir imagen')
        }
      }

      // Subir video de presentación si hay archivo nuevo
      let finalVideoUrl: string | null = videoUrl || null
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

      // Si se eliminó el video (no hay preview ni archivo)
      if (!videoPreview && !videoFile && !videoUrl) {
        finalVideoUrl = null
      }

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const body = {
        title,
        description: description || null,
        short_description: shortDescription || null,
        thumbnail_url: finalThumbnailUrl || null,
        presentation_video_url: finalVideoUrl,
        instructor_name: instructorName || null,
        instructor_bio: instructorBio || null,
        category: category || null,
        tags,
        is_published: isPublished
      }

      const url = isEditing
        ? `/api/admin/courses/${course.id}`
        : '/api/admin/courses'

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar')
      }

      // Después de guardar exitosamente, eliminar video anterior si cambió
      if (originalVideoUrl && originalVideoUrl !== finalVideoUrl) {
        await deleteFromStorage(originalVideoUrl)
      }

      // Limpiar previews
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview)
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/courses')
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
            <h3 className="text-lg font-semibold text-white">Informacion basica</h3>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Titulo *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Marketing Digital para Principiantes"
                required
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Descripcion corta</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Una linea que describe el curso"
                maxLength={200}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Descripcion completa</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe en detalle que aprendera el estudiante..."
                rows={5}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Instructor */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Instructor</h3>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Nombre del instructor</label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Ej: Juan Perez"
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Bio del instructor</label>
              <textarea
                value={instructorBio}
                onChange={(e) => setInstructorBio(e.target.value)}
                placeholder="Breve biografia del instructor..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Imagen</h3>

            <div className="aspect-video rounded-lg bg-slate-700 overflow-hidden relative">
              {(thumbnailPreview || thumbnailUrl) ? (
                <>
                  <img
                    src={thumbnailPreview || thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                    onError={() => {
                      setThumbnailUrl('')
                      setThumbnailPreview(null)
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-600/50 transition-colors">
                  <Upload className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-400">Subir imagen</span>
                  <span className="text-xs text-slate-500 mt-1">PNG, JPG hasta 50MB</span>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {!thumbnailUrl && !thumbnailPreview && (
              <p className="text-xs text-slate-500 text-center">
                Haz clic en el area para subir una imagen
              </p>
            )}
          </div>

          {/* Video de Presentación */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Video de Presentación</h3>
            </div>

            <div className="aspect-video rounded-lg bg-slate-700 overflow-hidden relative">
              {(videoPreview || videoUrl) ? (
                <>
                  <video
                    src={videoPreview || videoUrl}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                    onError={() => {
                      setVideoUrl('')
                      setVideoPreview(null)
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-12 w-12 text-white/80" />
                  </div>
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
                  <Video className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-400">Subir video</span>
                  <span className="text-xs text-slate-500 mt-1">MP4, WebM hasta 50MB</span>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {(videoPreview || videoUrl) && (
              <label className="block w-full text-center">
                <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                  Cambiar video
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            )}

            <p className="text-xs text-slate-500 text-center">
              Este video se mostrará en la página del curso
            </p>
          </div>

          {/* Category & Tags */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Organizacion</h3>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white outline-none focus:border-indigo-500"
              >
                <option value="">Sin categoria</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Tags (separados por coma)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="marketing, redes sociales, ads"
                className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Configuracion</h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Publicado</p>
                <p className="text-xs text-slate-400">Visible para estudiantes</p>
              </div>
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/courses')}
          className="border-slate-700 text-slate-300 bg-transparent"
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
          {isEditing ? 'Guardar cambios' : 'Crear curso'}
        </Button>
      </div>
    </form>
  )
}
