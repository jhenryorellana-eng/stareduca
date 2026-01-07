'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
  HelpCircle,
  CheckCircle,
  Settings,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ExamQuestion {
  id: string
  question_text: string
  options: { text: string }[]
  correct_option_index: number
  order_index: number
  created_at: string
}

interface CourseExam {
  id: string
  course_id: string
  title: string
  description: string | null
  passing_percentage: number
  is_enabled: boolean
  questions_count: number
  created_at: string
}

interface Course {
  id: string
  title: string
  slug: string
}

interface SortableQuestionItemProps {
  question: ExamQuestion
  index: number
  deleting: string | null
  onEdit: (question: ExamQuestion) => void
  onDelete: (id: string) => void
}

function SortableQuestionItem({ question, index, deleting, onEdit, onDelete }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const correctOption = question.options[question.correct_option_index]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors mt-1"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Question number */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
        <span className="text-indigo-400 font-semibold">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium line-clamp-2">{question.question_text}</p>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <span className="text-green-400">
            {String.fromCharCode(65 + question.correct_option_index)}: {correctOption?.text}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {question.options.map((opt, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-1 rounded ${
                idx === question.correct_option_index
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              {String.fromCharCode(65 + idx)}: {opt.text.length > 30 ? opt.text.substring(0, 30) + '...' : opt.text}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(question)}
          className="border-amber-300 text-amber-300 bg-amber-300/40 hover:bg-amber-300"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(question.id)}
          disabled={deleting === question.id}
          className="border-red-400 text-red-400 bg-red-400/40 hover:bg-red-400"
        >
          {deleting === question.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

// Modal para editar/crear pregunta
function QuestionModal({
  isOpen,
  question,
  onClose,
  onSave,
  saving
}: {
  isOpen: boolean
  question: ExamQuestion | null
  onClose: () => void
  onSave: (data: { question_text: string; options: { text: string }[]; correct_option_index: number }) => void
  saving: boolean
}) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)

  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text)
      setOptions(question.options.map(o => o.text))
      setCorrectIndex(question.correct_option_index)
    } else {
      setQuestionText('')
      setOptions(['', '', '', ''])
      setCorrectIndex(0)
    }
  }, [question, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      question_text: questionText,
      options: options.map(text => ({ text })),
      correct_option_index: correctIndex
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {question ? 'Editar Pregunta' : 'Nueva Pregunta'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pregunta */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Pregunta *
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              placeholder="Escribe la pregunta..."
              required
              minLength={5}
            />
          </div>

          {/* Opciones */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Opciones (selecciona la correcta) *
            </label>
            <div className="space-y-3">
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCorrectIndex(idx)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      correctIndex === idx
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[idx] = e.target.value
                      setOptions(newOptions)
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    placeholder={`Opcion ${String.fromCharCode(65 + idx)}`}
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Haz clic en la letra para marcar la opcion correcta
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ExamPage() {
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [exam, setExam] = useState<CourseExam | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [savingExam, setSavingExam] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)

  // Estado del modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)

  // Estado de configuracion
  const [passingPercentage, setPassingPercentage] = useState(70)
  const [isEnabled, setIsEnabled] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/exam`)
      const data = await response.json()

      if (data.success) {
        setCourse(data.course)
        setExam(data.exam)
        if (data.exam) {
          setPassingPercentage(data.exam.passing_percentage)
          setIsEnabled(data.exam.is_enabled)
        }
      }
    } catch (error) {
      console.error('Error fetching exam:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    if (!exam) return

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/exam/questions`)
      const data = await response.json()

      if (data.success) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  useEffect(() => {
    fetchExam()
  }, [courseId])

  useEffect(() => {
    if (exam) {
      fetchQuestions()
    }
  }, [exam])

  const handleCreateExam = async () => {
    setSavingExam(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Examen Final',
          passing_percentage: passingPercentage
        })
      })

      const data = await response.json()
      if (data.success) {
        setExam(data.exam)
      }
    } catch (error) {
      console.error('Error creating exam:', error)
    } finally {
      setSavingExam(false)
    }
  }

  const handleUpdateExam = async () => {
    if (!exam) return

    setSavingExam(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/exam`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passing_percentage: passingPercentage,
          is_enabled: isEnabled
        })
      })

      const data = await response.json()
      if (data.success) {
        setExam(data.exam)
        setPassingPercentage(data.exam.passing_percentage)
        setIsEnabled(data.exam.is_enabled)
      } else {
        alert(data.error || 'Error al actualizar')
        // Revertir cambios
        if (exam) {
          setPassingPercentage(exam.passing_percentage)
          setIsEnabled(exam.is_enabled)
        }
      }
    } catch (error) {
      console.error('Error updating exam:', error)
    } finally {
      setSavingExam(false)
    }
  }

  const handleSaveQuestion = async (data: { question_text: string; options: { text: string }[]; correct_option_index: number }) => {
    setSavingQuestion(true)
    try {
      if (editingQuestion) {
        // Actualizar pregunta existente
        const response = await fetch(`/api/admin/courses/${courseId}/exam/questions/${editingQuestion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        const result = await response.json()
        if (result.success) {
          setQuestions(prev => prev.map(q =>
            q.id === editingQuestion.id ? result.question : q
          ))
          setModalOpen(false)
          setEditingQuestion(null)
        } else {
          alert(result.error || 'Error al actualizar')
        }
      } else {
        // Crear nueva pregunta
        const response = await fetch(`/api/admin/courses/${courseId}/exam/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        const result = await response.json()
        if (result.success) {
          setQuestions(prev => [...prev, result.question])
          setModalOpen(false)
          // Actualizar conteo en exam
          if (exam) {
            setExam({ ...exam, questions_count: exam.questions_count + 1 })
          }
        } else {
          alert(result.error || 'Error al crear')
        }
      }
    } catch (error) {
      console.error('Error saving question:', error)
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('¿Estas seguro de eliminar esta pregunta?')) return

    setDeleting(questionId)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/exam/questions/${questionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        setQuestions(prev => prev.filter(q => q.id !== questionId))
        // Actualizar conteo en exam
        if (exam) {
          const newCount = exam.questions_count - 1
          setExam({ ...exam, questions_count: newCount })
          // Si no quedan preguntas, deshabilitar
          if (newCount === 0) {
            setIsEnabled(false)
          }
        }
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex(q => q.id === active.id)
    const newIndex = questions.findIndex(q => q.id === over.id)

    const newQuestions = arrayMove(questions, oldIndex, newIndex).map((q, idx) => ({
      ...q,
      order_index: idx + 1
    }))

    setQuestions(newQuestions)

    try {
      await fetch(`/api/admin/courses/${courseId}/exam/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: newQuestions.map(q => q.id) })
      })
    } catch (error) {
      console.error('Error reordering questions:', error)
      fetchQuestions()
    }
  }

  const openNewQuestion = () => {
    setEditingQuestion(null)
    setModalOpen(true)
  }

  const openEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${courseId}`}>
            <Button variant="ghost" className="border-1 border-transparent text-slate-400 hover:text-white hover:border-slate-700 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al curso
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Examen Final</h1>
            <p className="text-sm text-slate-400">{course?.title}</p>
          </div>
        </div>
        {exam && (
          <Button onClick={openNewQuestion} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva pregunta
          </Button>
        )}
      </div>

      {/* Si no existe examen, mostrar boton para crear */}
      {!exam ? (
        <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <HelpCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hay examen configurado</h3>
          <p className="text-slate-400 mb-6">Crea un examen para que los estudiantes puedan evaluarse al completar el curso</p>
          <Button
            onClick={handleCreateExam}
            disabled={savingExam}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {savingExam ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear examen
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Configuracion del examen */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Configuracion</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Porcentaje de aprobacion */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Porcentaje minimo para aprobar
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-white font-semibold w-12 text-right">{passingPercentage}%</span>
                </div>
              </div>

              {/* Habilitar examen */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Estado del examen
                </label>
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  disabled={questions.length === 0}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isEnabled
                      ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                  } ${questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-slate-500'}`} />
                  {isEnabled ? 'Habilitado' : 'Deshabilitado'}
                </button>
                {questions.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">Agrega al menos una pregunta para habilitar</p>
                )}
              </div>
            </div>

            {/* Boton guardar configuracion */}
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
              <Button
                onClick={handleUpdateExam}
                disabled={savingExam}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {savingExam ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar configuracion
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Lista de preguntas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Preguntas ({questions.length})
              </h2>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <HelpCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No hay preguntas</h3>
                <p className="text-slate-400 mb-4">Crea la primera pregunta para este examen</p>
                <Button onClick={openNewQuestion} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear pregunta
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <SortableQuestionItem
                        key={question.id}
                        question={question}
                        index={index}
                        deleting={deleting}
                        onEdit={openEditQuestion}
                        onDelete={handleDeleteQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Resumen */}
          {questions.length > 0 && (
            <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-sm text-slate-400">
              <span>{questions.length} preguntas</span>
              <span>Minimo para aprobar: {passingPercentage}%</span>
              <span className={isEnabled ? 'text-green-400' : 'text-amber-400'}>
                {isEnabled ? 'Examen habilitado' : 'Examen deshabilitado'}
              </span>
            </div>
          )}
        </>
      )}

      {/* Modal de pregunta */}
      <QuestionModal
        isOpen={modalOpen}
        question={editingQuestion}
        onClose={() => {
          setModalOpen(false)
          setEditingQuestion(null)
        }}
        onSave={handleSaveQuestion}
        saving={savingQuestion}
      />
    </div>
  )
}
