'use client'

import { Monitor, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function PreviewDialog({
  preview,
  onClose,
  onDevice,
}: {
  preview: { url: string; title: string; device: 'desktop' | 'mobile' } | null
  onClose: () => void
  onDevice: (d: 'desktop' | 'mobile') => void
}) {
  return (
    <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[90vh] max-w-[95vw] flex-col gap-3 p-3 sm:max-w-[95vw]">
        <div className="flex items-center justify-between pr-8">
          <DialogTitle className="text-sm">{preview?.title} — preview</DialogTitle>
          <div className="flex gap-1">
            <Button size="icon" variant={preview?.device === 'desktop' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => onDevice('desktop')} aria-label="Desktop">
              <Monitor className="h-4 w-4" />
            </Button>
            <Button size="icon" variant={preview?.device === 'mobile' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => onDevice('mobile')} aria-label="Mobile">
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 justify-center overflow-hidden rounded-lg bg-muted">
          {preview && (
            <iframe
              src={preview.url}
              title="Theme preview"
              sandbox="allow-scripts allow-forms allow-popups"
              className={cn('h-full border-0 bg-white transition-all', preview.device === 'mobile' ? 'w-[390px]' : 'w-full')}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
