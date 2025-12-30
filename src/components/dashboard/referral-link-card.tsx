'use client'

import { useState } from 'react'
import { Copy, Check, QrCode, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APP_URL } from '@/lib/constants'

interface ReferralLinkCardProps {
  referralCode: string
  appSlug: string
  linkClicks?: number
}

export function ReferralLinkCard({ referralCode, appSlug, linkClicks = 0 }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false)

  const referralLink = `${APP_URL}/${appSlug}/ref/${referralCode}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-indigo-400" />
          Tu Link de Afiliado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
            <p className="text-sm text-indigo-400 font-mono truncate">
              {referralLink}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyLink}
            className="border-slate-600 hover:bg-slate-700"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-slate-400" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <QrCode className="h-4 w-4" />
            <span>Clics totales:</span>
          </div>
          <span className="font-semibold text-white">{linkClicks}</span>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            Comparte este link en redes sociales, blogs o con amigos.
            Cuando alguien se suscriba usando tu link, ganarás el 80% de comisión.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
