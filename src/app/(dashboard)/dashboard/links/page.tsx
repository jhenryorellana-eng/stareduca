'use client'

import { useState, useEffect } from 'react'
import { Link2, Copy, Check, QrCode, ExternalLink, MousePointer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { APP_URL } from '@/lib/constants'

export default function LinksPage() {
  const [affiliate, setAffiliate] = useState<{
    referral_code: string
    link_clicks: number
    app?: { slug: string; name: string }
  } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAffiliate = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('affiliates')
          .select(`
            referral_code,
            link_clicks,
            app:apps!affiliates_app_id_fkey(slug, name)
          `)
          .eq('user_id', user.id)
          .single()

        setAffiliate(data)
      }
      setLoading(false)
    }

    loadAffiliate()
  }, [])

  const appSlug = affiliate?.app?.slug || 'starbooks'
  const baseLink = `${APP_URL}/${appSlug}/ref/${affiliate?.referral_code || ''}`

  const buildLink = () => {
    const params = new URLSearchParams()
    if (utmSource) params.append('utm_source', utmSource)
    if (utmMedium) params.append('utm_medium', utmMedium)
    if (utmCampaign) params.append('utm_campaign', utmCampaign)

    const queryString = params.toString()
    return queryString ? `${baseLink}?${queryString}` : baseLink
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Links de Afiliado</h1>
        <p className="text-slate-400">
          Gestiona y personaliza tus links de referido para diferentes plataformas.
        </p>
      </div>

      {/* Stats */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-600/20">
              <MousePointer className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Clics Totales en tus Links</p>
              <p className="text-3xl font-bold text-white">{affiliate?.link_clicks || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Link */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Link2 className="h-5 w-5 text-indigo-400" />
            Link Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-600">
              <p className="text-sm text-indigo-400 font-mono break-all">
                {baseLink}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(baseLink, 'main')}
              className="border-slate-600 hover:bg-slate-700 shrink-0"
            >
              {copied === 'main' ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-slate-400" />
              )}
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            Este es tu link principal. Úsalo para compartir en cualquier lugar.
          </p>
        </CardContent>
      </Card>

      {/* UTM Builder */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-purple-400" />
            Generador de Links con UTM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Agrega parámetros UTM para rastrear de dónde vienen tus clics.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="utm_source" className="text-slate-300">Fuente (utm_source)</Label>
              <Input
                id="utm_source"
                placeholder="ej: instagram"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_medium" className="text-slate-300">Medio (utm_medium)</Label>
              <Input
                id="utm_medium"
                placeholder="ej: social"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_campaign" className="text-slate-300">Campaña (utm_campaign)</Label>
              <Input
                id="utm_campaign"
                placeholder="ej: black_friday"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <Label className="text-slate-300 mb-2 block">Link Generado</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
                <p className="text-sm text-indigo-400 font-mono break-all">
                  {buildLink()}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(buildLink(), 'custom')}
                className="border-slate-600 hover:bg-slate-700 shrink-0"
              >
                {copied === 'custom' ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-400" />
            Código QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-4 rounded-xl">
              {/* Simple QR placeholder - in production use a QR library */}
              <div className="h-32 w-32 bg-slate-200 flex items-center justify-center">
                <QrCode className="h-16 w-16 text-slate-400" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-slate-300 mb-2">
                Descarga tu código QR para compartirlo en eventos presenciales o materiales impresos.
              </p>
              <p className="text-sm text-slate-400 mb-4">
                El QR apunta a tu link principal: {baseLink}
              </p>
              <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
                Descargar QR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Links Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Instagram', source: 'instagram', medium: 'social' },
              { name: 'TikTok', source: 'tiktok', medium: 'social' },
              { name: 'Twitter/X', source: 'twitter', medium: 'social' },
              { name: 'YouTube', source: 'youtube', medium: 'video' },
              { name: 'WhatsApp', source: 'whatsapp', medium: 'messenger' },
              { name: 'Email', source: 'email', medium: 'email' },
            ].map((platform) => {
              const link = `${baseLink}?utm_source=${platform.source}&utm_medium=${platform.medium}`
              return (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <span className="text-sm text-white">{platform.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(link, platform.name)}
                    className="text-slate-400 hover:text-white"
                  >
                    {copied === platform.name ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-2">Copiar</span>
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
