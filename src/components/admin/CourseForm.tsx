'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface CourseFormProps {
  course?: {
    id: string
    title: string
    description: string | null
    short_description: string | null
    thumbnail_url: string | null
    instructor_name: string | null
    instructor_bio: string | null
    category: string | null
    tags: string[]
    is_published: boolean
    is_featured: boolean
    is_free: boolean
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
  const [instructorName, setInstructorName] = useState(course?.instructor_name || '')
  const [instructorBio, setInstructorBio] = useState(course?.instructor_bio || '')
  const [category, setCategory] = useState(course?.category || '')
  const [tagsInput, setTagsInput] = useState(course?.tags?.join(', ') || '')
  const [isPublished, setIsPublished] = useState(course?.is_published || false)
  const [isFeatured, setIsFeatured] = useState(course?.is_featured || false)
  const [isFree, setIsFree] = useState(course?.is_free || false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const body = {
        title,
        description: description || null,
        short_description: shortDescription || null,
        thumbnail_url: thumbnailUrl || null,
        instructor_name: instructorName || null,
        instructor_bio: instructorBio || null,
        category: category || null,
        tags,
        is_published: isPublished,
        is_featured: isFeatured,
        is_free: isFree
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

            <div className="aspect-video rounded-lg bg-slate-700 overflow-hidden">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  onError={() => setThumbnailUrl('')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-slate-500" />
                </div>
              )}
            </div>

            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="URL de la imagen..."
              className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
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

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Destacado</p>
                <p className="text-xs text-slate-400">Mostrar en inicio</p>
              </div>
              <Switch
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Gratuito</p>
                <p className="text-xs text-slate-400">Acceso sin suscripcion</p>
              </div>
              <Switch
                checked={isFree}
                onCheckedChange={setIsFree}
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
          {isEditing ? 'Guardar cambios' : 'Crear curso'}
        </Button>
      </div>
    </form>
  )
}
