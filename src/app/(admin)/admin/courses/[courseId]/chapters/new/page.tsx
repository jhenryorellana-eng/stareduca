'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChapterForm } from '@/components/admin/ChapterForm'

export default function NewChapterPage() {
  const params = useParams()
  const courseId = params.courseId as string

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/courses/${courseId}/chapters`}>
          <Button variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Nuevo capitulo</h1>
      </div>

      <ChapterForm courseId={courseId} />
    </div>
  )
}
