import { useEffect, useState } from 'react'
import { Award, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { certificatesApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { Certificate } from '@/types'

export function CertificatesPage() {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    certificatesApi
      .list()
      .then((res) => setCertificates(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (cert: Certificate) => {
    try {
      const res = await certificatesApi.download(cert.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${cert.course_title.replace(/\s+/g, '-')}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      toast({
        title: 'Certificate downloaded',
        description: cert.course_title,
        variant: 'success',
      })
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Download failed', description: message, variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Certificates</h1>
        <p className="text-muted-foreground">Download certificates for completed courses</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && certificates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Award className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No certificates earned yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete a course to receive your certificate.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {certificates.map((cert) => (
          <Card key={cert.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-base">{cert.course_title}</CardTitle>
                  <CardDescription>
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={() => handleDownload(cert)}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
