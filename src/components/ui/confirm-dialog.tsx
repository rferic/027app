'use client'

import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  loading?: boolean
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 space-y-4 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 outline-none">
          <Dialog.Title className="text-base font-semibold text-slate-900">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm text-slate-500">{description}</Dialog.Description>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Dialog.Close className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              {cancelLabel}
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer',
                variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
