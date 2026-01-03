'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Loader2, AlertCircle } from 'lucide-react'

interface FileUploaderProps {
  onUpload: (url: string, size: number) => void
  accept?: string
  maxSize?: number // in bytes
  folder?: string
}

export function FileUploader({
  onUpload,
  accept = '*',
  maxSize = 50 * 1024 * 1024, // 50MB default
  folder = 'materials'
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFile = async (file: File) => {
    setError(null)

    // Validate file size
    if (file.size > maxSize) {
      setError(`El archivo excede el limite de ${formatFileSize(maxSize)}`)
      return
    }

    // Validate file type if accept is specified
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim())
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExt === type.toLowerCase()
        }
        return file.type.match(type.replace('*', '.*'))
      })

      if (!isAccepted) {
        setError(`Tipo de archivo no permitido. Acepta: ${accept}`)
        return
      }
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al subir archivo')
      }

      onUpload(data.url, data.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [])

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Subiendo archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`h-8 w-8 ${dragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
            <div>
              <p className="text-sm text-white">
                Arrastra un archivo aqui o <span className="text-indigo-400">selecciona</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Maximo {formatFileSize(maxSize)}
                {accept !== '*' && ` | ${accept}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}
