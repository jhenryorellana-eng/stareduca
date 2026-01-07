'use client'

import { useState, useRef, useEffect } from 'react'
import { Image, X, Send, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  full_name: string
  student_code: string
}

interface CreatePostFormProps {
  currentStudent?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  onSubmit: (data: { content: string; imageFile?: File }) => Promise<void>
  placeholder?: string
}

export function CreatePostForm({
  currentStudent,
  onSubmit,
  placeholder = "¿Que quieres compartir?"
}: CreatePostFormProps) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionSuggestions, setMentionSuggestions] = useState<Student[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`
    }
  }, [content])

  // Cleanup image preview URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Buscar usuarios para menciones
  useEffect(() => {
    const searchMentions = async () => {
      if (!mentionQuery || mentionQuery.length < 2) {
        setMentionSuggestions([])
        setShowMentions(false)
        return
      }

      try {
        const response = await fetch(`/api/students/search?q=${encodeURIComponent(mentionQuery)}`)
        const data = await response.json()
        if (data.success && data.students.length > 0) {
          setMentionSuggestions(data.students)
          setShowMentions(true)
        } else {
          setShowMentions(false)
        }
      } catch {
        setShowMentions(false)
      }
    }

    const debounce = setTimeout(searchMentions, 300)
    return () => clearTimeout(debounce)
  }, [mentionQuery])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)
    setError(null)

    // Detectar si se esta escribiendo una mencion
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
    } else {
      setMentionQuery(null)
      setShowMentions(false)
    }
  }

  const insertMention = (student: Student) => {
    if (!textareaRef.current) return

    const cursorPos = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const textAfterCursor = content.substring(cursorPos)

    // Reemplazar @query con @student_code
    const mentionMatch = textBeforeCursor.match(/@\w*$/)
    if (mentionMatch) {
      const newTextBefore = textBeforeCursor.substring(0, mentionMatch.index) + `@${student.student_code} `
      setContent(newTextBefore + textAfterCursor)

      // Mover cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.selectionStart = newTextBefore.length
          textareaRef.current.selectionEnd = newTextBefore.length
        }
      }, 0)
    }

    setShowMentions(false)
    setMentionQuery(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB')
      return
    }

    // Limpiar preview anterior
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Escribe algo para publicar')
      return
    }

    if (content.length > 10000) {
      setError('El contenido es demasiado largo (max 10000 caracteres)')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        content: content.trim(),
        imageFile: imageFile || undefined
      })

      // Limpiar formulario
      setContent('')
      removeImage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
          {currentStudent?.avatar_url ? (
            <img
              src={currentStudent.avatar_url}
              alt={currentStudent.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-transparent text-white placeholder-slate-500 resize-none outline-none text-base"
            disabled={isSubmitting}
          />

          {/* Mention suggestions */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1 w-64 max-h-48 overflow-y-auto rounded-lg bg-slate-700 border border-slate-600 shadow-lg z-20">
              {mentionSuggestions.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => insertMention(student)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-600 transition-colors text-left"
                >
                  <span className="text-white">{student.full_name}</span>
                  <span className="text-sm text-slate-400">@{student.student_code}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isSubmitting}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="mt-3 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="rounded-lg max-h-48 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}

          {/* Character count */}
          {content.length > 9000 && (
            <p className={cn(
              "mt-2 text-sm",
              content.length > 10000 ? "text-red-400" : "text-amber-400"
            )}>
              {content.length}/10000 caracteres
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-400 hover:text-white"
            disabled={isSubmitting}
          >
            <Image className="h-4 w-4 mr-2" />
            Imagen
          </Button>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
