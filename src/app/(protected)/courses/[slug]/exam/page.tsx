'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  RefreshCcw,
  Clock,
  HelpCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Question {
  id: string
  question_text: string
  options: { text: string }[]
}

interface ExamData {
  id: string
  title: string
  description: string | null
  passing_percentage: number
  questions_count: number
  questions: Question[]
}

interface ExamStats {
  totalAttempts: number
  bestScore: number
  passed: boolean
  passedAttemptId: string | null
}

interface ExamResult {
  attemptId: string
  score: number
  totalQuestions: number
  percentage: number
  passed: boolean
  passingPercentage: number
  questionResults: Record<string, { correct: boolean; correctIndex: number; selectedIndex: number }>
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [eligible, setEligible] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [exam, setExam] = useState<ExamData | null>(null)
  const [stats, setStats] = useState<ExamStats | null>(null)
  const [courseProgress, setCourseProgress] = useState<{ completed: number; total: number; percentage: number } | null>(null)

  // Estado del examen
  const [examStarted, setExamStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetch(`/api/courses/${slug}/exam`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error al cargar examen')
        }

        setEligible(data.eligible)
        setReason(data.reason || null)

        if (data.eligible) {
          setExam(data.exam)
          setStats(data.stats)
        } else {
          setCourseProgress(data.progress || null)
        }
      } catch (error) {
        console.error('Error fetching exam:', error)
        setReason('error')
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [slug])

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (!exam) return

    const unanswered = exam.questions.filter(q => answers[q.id] === undefined).length
    if (unanswered > 0) {
      if (!confirm(`Tienes ${unanswered} pregunta(s) sin responder. ¿Deseas enviar de todas formas?`)) {
        return
      }
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/courses/${slug}/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.result)
      } else {
        alert(data.error || 'Error al enviar examen')
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      alert('Error al enviar examen')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setExamStarted(false)
    setAnswers({})
    setCurrentQuestionIndex(0)
    setResult(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  // No elegible
  if (!eligible) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${slug}`)}
          className="text-slate-400 hover:text-white -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al curso
        </Button>

        <div className="text-center py-12 px-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          {reason === 'incomplete_course' && courseProgress && (
            <>
              <AlertCircle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Curso incompleto</h2>
              <p className="text-slate-400 mb-6">
                Debes completar todos los capitulos antes de acceder al examen
              </p>
              <div className="max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Progreso</span>
                  <span className="text-sm font-medium text-indigo-400">{courseProgress.percentage}%</span>
                </div>
                <Progress value={courseProgress.percentage} className="h-2" />
                <p className="text-sm text-slate-500 mt-2">
                  {courseProgress.completed} de {courseProgress.total} capitulos
                </p>
              </div>
              <Link href={`/courses/${slug}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Continuar curso
                </Button>
              </Link>
            </>
          )}

          {reason === 'no_exam' && (
            <>
              <HelpCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Sin examen</h2>
              <p className="text-slate-400 mb-6">
                Este curso no tiene examen configurado
              </p>
              <Link href={`/courses/${slug}`}>
                <Button variant="outline" className="border-slate-700">
                  Volver al curso
                </Button>
              </Link>
            </>
          )}

          {reason === 'exam_disabled' && (
            <>
              <Clock className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Examen no disponible</h2>
              <p className="text-slate-400 mb-6">
                El examen no esta habilitado actualmente
              </p>
              <Link href={`/courses/${slug}`}>
                <Button variant="outline" className="border-slate-700">
                  Volver al curso
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  // Mostrar resultado
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${slug}`)}
          className="text-slate-400 hover:text-white -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al curso
        </Button>

        <div className={`text-center py-12 px-6 rounded-xl border ${
          result.passed
            ? 'bg-green-900/20 border-green-700/50'
            : 'bg-red-900/20 border-red-700/50'
        }`}>
          {result.passed ? (
            <>
              <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Felicidades!</h2>
              <p className="text-green-400 text-lg mb-4">Has aprobado el examen</p>
            </>
          ) : (
            <>
              <XCircle className="h-20 w-20 text-red-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">No aprobado</h2>
              <p className="text-red-400 text-lg mb-4">Necesitas {result.passingPercentage}% para aprobar</p>
            </>
          )}

          <div className="text-6xl font-bold text-white mb-2">
            {result.percentage}%
          </div>
          <p className="text-slate-400 mb-8">
            {result.score} de {result.totalQuestions} respuestas correctas
          </p>

          <div className="flex justify-center gap-4">
            <Link href={`/courses/${slug}`}>
              <Button variant="outline" className="border-slate-700">
                Volver al curso
              </Button>
            </Link>
            {!result.passed && (
              <Button onClick={handleRetry} className="bg-indigo-600 hover:bg-indigo-700">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Intentar de nuevo
              </Button>
            )}
          </div>
        </div>

        {/* Detalle de respuestas */}
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Detalle de respuestas</h3>
          <div className="space-y-4">
            {exam?.questions.map((question, idx) => {
              const qResult = result.questionResults[question.id]
              return (
                <div key={question.id} className={`p-4 rounded-lg border ${
                  qResult?.correct
                    ? 'bg-green-900/20 border-green-700/30'
                    : 'bg-red-900/20 border-red-700/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {qResult?.correct ? (
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">
                        {idx + 1}. {question.question_text}
                      </p>
                      <div className="space-y-1 text-sm">
                        {qResult?.selectedIndex >= 0 && (
                          <p className={qResult?.correct ? 'text-green-400' : 'text-red-400'}>
                            Tu respuesta: {String.fromCharCode(65 + qResult.selectedIndex)} - {question.options[qResult.selectedIndex]?.text}
                          </p>
                        )}
                        {!qResult?.correct && qResult?.correctIndex !== undefined && (
                          <p className="text-green-400">
                            Correcta: {String.fromCharCode(65 + qResult.correctIndex)} - {question.options[qResult.correctIndex]?.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Pantalla de inicio del examen
  if (!examStarted && exam) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${slug}`)}
          className="text-slate-400 hover:text-white -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al curso
        </Button>

        <div className="text-center py-12 px-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <HelpCircle className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">{exam.title}</h1>
          {exam.description && (
            <p className="text-slate-400 mb-6">{exam.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
            <div className="p-4 rounded-lg bg-slate-700/50">
              <div className="text-2xl font-bold text-white">{exam.questions_count}</div>
              <div className="text-sm text-slate-400">Preguntas</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/50">
              <div className="text-2xl font-bold text-white">{exam.passing_percentage}%</div>
              <div className="text-sm text-slate-400">Para aprobar</div>
            </div>
          </div>

          {stats && stats.totalAttempts > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-indigo-900/20 border border-indigo-700/30">
              <p className="text-indigo-300 text-sm">
                Has realizado {stats.totalAttempts} intento(s). Mejor puntuacion: {stats.bestScore}%
                {stats.passed && (
                  <span className="block mt-1 text-green-400">Ya has aprobado este examen</span>
                )}
              </p>
            </div>
          )}

          <Button
            onClick={() => setExamStarted(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-8"
          >
            Comenzar examen
          </Button>
        </div>
      </div>
    )
  }

  // Examen en progreso
  if (examStarted && exam) {
    const currentQuestion = exam.questions[currentQuestionIndex]
    const answeredCount = Object.keys(answers).length
    const progressPercent = (answeredCount / exam.questions.length) * 100

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Pregunta {currentQuestionIndex + 1} de {exam.questions.length}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{answeredCount} respondidas</span>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progressPercent} className="h-2" />

        {/* Question */}
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">
            {currentQuestion.question_text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(currentQuestion.id, idx)}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  answers[currentQuestion.id] === idx
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                } border`}
              >
                <span className="font-semibold mr-3">{String.fromCharCode(65 + idx)}.</span>
                {option.text}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="border-slate-700"
          >
            Anterior
          </Button>

          <div className="flex gap-2">
            {exam.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-indigo-600 text-white'
                    : answers[exam.questions[idx].id] !== undefined
                    ? 'bg-green-600/50 text-green-300'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < exam.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar examen'
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}
