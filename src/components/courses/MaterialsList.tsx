'use client'

import { FileText, ExternalLink, Download, Play, AlignLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Material {
  id: string
  title: string
  type: 'pdf' | 'link' | 'text' | 'download' | 'video'
  url?: string | null
  content?: string | null
}

interface MaterialsListProps {
  materials: Material[]
}

const materialIcons = {
  pdf: FileText,
  link: ExternalLink,
  text: AlignLeft,
  download: Download,
  video: Play,
}

const materialLabels = {
  pdf: 'PDF',
  link: 'Enlace',
  text: 'Texto',
  download: 'Descarga',
  video: 'Video',
}

export function MaterialsList({ materials }: MaterialsListProps) {
  if (!materials || materials.length === 0) {
    return null
  }

  const handleOpen = (material: Material) => {
    if (material.url) {
      window.open(material.url, '_blank')
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
        Materiales
      </h4>
      <div className="space-y-2">
        {materials.map((material) => {
          const Icon = materialIcons[material.type] || FileText
          const isText = material.type === 'text'

          if (isText && material.content) {
            return (
              <div
                key={material.id}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-700/50">
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <span className="text-sm font-medium text-white">{material.title}</span>
                </div>
                <div className="text-sm text-slate-400 whitespace-pre-line">
                  {material.content}
                </div>
              </div>
            )
          }

          return (
            <button
              key={material.id}
              onClick={() => handleOpen(material)}
              disabled={!material.url}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/30 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-indigo-500/20 transition-colors">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-indigo-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                  {material.title}
                </p>
                <p className="text-xs text-slate-500">
                  {materialLabels[material.type]}
                </p>
              </div>
              {material.url && (
                <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
