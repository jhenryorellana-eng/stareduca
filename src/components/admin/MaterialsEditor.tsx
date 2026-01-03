'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  Video,
  FileText,
  Link as LinkIcon,
  Download,
  Edit,
  X,
  Loader2,
  Save,
  File
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUploader } from '@/components/admin/FileUploader'

interface Material {
  id: string
  material_type: 'video' | 'text' | 'pdf' | 'link' | 'download'
  title: string
  description: string | null
  content: string | null
  file_url: string | null
  file_size: number | null
  order_index: number
}

interface MaterialsEditorProps {
  courseId: string
  chapterId: string
  materials: Material[]
  onUpdate: () => void
}

const MATERIAL_TYPES = [
  { value: 'text', label: 'Texto', icon: FileText, description: 'Contenido de texto enriquecido' },
  { value: 'pdf', label: 'PDF', icon: File, description: 'Documento PDF para descargar' },
  { value: 'link', label: 'Enlace', icon: LinkIcon, description: 'Link a recurso externo' },
  { value: 'download', label: 'Archivo', icon: Download, description: 'Archivo para descargar' },
]

export function MaterialsEditor({ courseId, chapterId, materials, onUpdate }: MaterialsEditorProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'text': return FileText
      case 'pdf': return File
      case 'link': return LinkIcon
      case 'download': return Download
      default: return FileText
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm('¿Eliminar este material?')) return

    setDeleting(materialId)
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/chapters/${chapterId}/materials?materialId=${materialId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()
      if (data.success) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting material:', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Materiales del capitulo</h3>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar material
        </Button>
      </div>

      {/* Materials list */}
      {materials.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin materiales</h3>
          <p className="text-slate-400 mb-4">Agrega PDFs, textos, enlaces o archivos complementarios</p>
          <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar material
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => {
            const Icon = getMaterialIcon(material.material_type)
            return (
              <div
                key={material.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className="text-slate-600 cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{material.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="capitalize">{material.material_type}</span>
                    {material.file_size && (
                      <span>{formatFileSize(material.file_size)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingMaterial(material)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(material.id)}
                    disabled={deleting === material.id}
                    className="text-red-400 hover:text-red-300"
                  >
                    {deleting === material.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <MaterialModal
          courseId={courseId}
          chapterId={chapterId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            onUpdate()
          }}
        />
      )}

      {/* Edit modal */}
      {editingMaterial && (
        <MaterialModal
          courseId={courseId}
          chapterId={chapterId}
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSuccess={() => {
            setEditingMaterial(null)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}

// Modal for adding/editing materials
interface MaterialModalProps {
  courseId: string
  chapterId: string
  material?: Material
  onClose: () => void
  onSuccess: () => void
}

function MaterialModal({ courseId, chapterId, material, onClose, onSuccess }: MaterialModalProps) {
  const isEditing = !!material

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [materialType, setMaterialType] = useState(material?.material_type || 'text')
  const [title, setTitle] = useState(material?.title || '')
  const [description, setDescription] = useState(material?.description || '')
  const [content, setContent] = useState(material?.content || '')
  const [fileUrl, setFileUrl] = useState(material?.file_url || '')
  const [fileSize, setFileSize] = useState<number | null>(material?.file_size || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const body: any = {
        title,
        description: description || null,
        content: materialType === 'text' ? content : null,
        file_url: ['pdf', 'download'].includes(materialType) ? fileUrl : (materialType === 'link' ? content : null),
        file_size: fileSize
      }

      if (isEditing) {
        body.materialId = material.id
      } else {
        body.material_type = materialType
      }

      const response = await fetch(
        `/api/admin/courses/${courseId}/chapters/${chapterId}/materials`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      )

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUploaded = (url: string, size: number) => {
    setFileUrl(url)
    setFileSize(size)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {isEditing ? 'Editar material' : 'Nuevo material'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Material type selector (only for new) */}
          {!isEditing && (
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Tipo de material</label>
              <div className="grid grid-cols-2 gap-2">
                {MATERIAL_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setMaterialType(type.value as any)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        materialType === type.value
                          ? 'border-indigo-500 bg-indigo-600/20'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${materialType === type.value ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span className={materialType === type.value ? 'text-white' : 'text-slate-300'}>
                          {type.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Titulo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo del material"
              required
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Descripcion (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripcion"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Content based on type */}
          {materialType === 'text' && (
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Contenido</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe el contenido aqui... (soporta markdown)"
                rows={8}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none font-mono text-sm"
              />
            </div>
          )}

          {materialType === 'link' && (
            <div>
              <label className="text-sm text-slate-400 mb-2 block">URL del enlace</label>
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {(materialType === 'pdf' || materialType === 'download') && (
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Archivo</label>
              {fileUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <File className="h-5 w-5 text-indigo-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{fileUrl.split('/').pop()}</p>
                    {fileSize && <p className="text-xs text-slate-500">{formatFileSize(fileSize)}</p>}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => { setFileUrl(''); setFileSize(null) }}
                    className="text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <FileUploader
                  onUpload={handleFileUploaded}
                  accept={materialType === 'pdf' ? '.pdf' : '*'}
                  maxSize={50 * 1024 * 1024} // 50MB
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
