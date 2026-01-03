'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourseForm } from '@/components/admin/CourseForm'

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Nuevo curso</h1>
      </div>

      <CourseForm />
    </div>
  )
}
