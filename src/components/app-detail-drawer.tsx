'use client'

import { useTranslations } from 'next-intl'
import { X, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { Drawer } from '@base-ui/react/drawer'
import { Dialog } from '@base-ui/react/dialog'
import { useMediaQuery } from '@base-ui/react/unstable-use-media-query'
import type { AppManifest } from '@/types/apps'

interface Props {
  manifest: AppManifest
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
    {children}
  </h3>
)

function DetailBody({ manifest }: { manifest: AppManifest }) {
  const t = useTranslations('admin.apps.detail')

  return (
    <>
      {/* General */}
      <section>
        <SectionTitle>{t('general')}</SectionTitle>
        <div className="space-y-2 text-sm">
          <p className="text-slate-600">{manifest.description}</p>
          {manifest.author.name && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>{t('author')}: {manifest.author.name}</span>
              {manifest.author.url && (
                <a
                  href={manifest.author.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 inline-flex items-center"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Colors */}
      <section>
        <SectionTitle>{t('colors')}</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: manifest.primaryColor }}
            />
            <span className="text-xs text-slate-500">
              {t('primary')} <code className="text-slate-400">{manifest.primaryColor}</code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: manifest.secondaryColor }}
            />
            <span className="text-xs text-slate-500">
              {t('secondary')} <code className="text-slate-400">{manifest.secondaryColor}</code>
            </span>
          </div>
        </div>
      </section>

      {/* Views */}
      <section>
        <SectionTitle>{t('views')}</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {(['public', 'admin', 'widget', 'native'] as const).map((view) => (
            <div key={view} className="flex items-center gap-2 text-sm">
              {manifest.views[view] ? (
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle size={14} className="text-slate-300 flex-shrink-0" />
              )}
              <span className={manifest.views[view] ? 'text-slate-700' : 'text-slate-400'}>
                {t(`views_${view}` as Parameters<typeof t>[0])}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Config fields */}
      {manifest.config.length > 0 && (
        <section>
          <SectionTitle>{t('configFields')}</SectionTitle>
          <div className="space-y-1.5">
            {manifest.config.map((field) => (
              <div
                key={field.key}
                className="flex items-center gap-2 text-sm py-1.5 px-2.5 rounded-md bg-slate-50"
              >
                <code className="text-xs font-mono text-slate-600 flex-1 truncate">
                  {field.key}
                </code>
                <span className="text-xs text-slate-400 flex-shrink-0">{field.type}</span>
                {field.required ? (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex-shrink-0">
                    {t('required')}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 flex-shrink-0">
                    {t('optional')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dependencies */}
      <section>
        <SectionTitle>{t('dependencies')}</SectionTitle>
        {manifest.dependencies.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {manifest.dependencies.map((dep) => (
              <span
                key={dep}
                className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono"
              >
                {dep}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">{t('none')}</p>
        )}
      </section>

      {/* API */}
      <section>
        <SectionTitle>{t('api')}</SectionTitle>
        <div className="flex items-center gap-2 text-sm">
          {manifest.api ? (
            <CheckCircle size={14} className="text-emerald-500" />
          ) : (
            <XCircle size={14} className="text-slate-300" />
          )}
          <span className={manifest.api ? 'text-slate-700' : 'text-slate-400'}>
            {manifest.api ? t('enabled') : t('disabled')}
          </span>
        </div>
      </section>
    </>
  )
}

export function AppDetailDrawer({ manifest, open, onOpenChange }: Props) {
  const t = useTranslations('admin.apps.detail')
  const isDesktop = useMediaQuery('(min-width: 768px)', { noSsr: true })

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) onOpenChange(false)
  }

  if (isDesktop) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={handleOpenChange}
        modal
        swipeDirection="left"
      >
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 bg-black/40 z-40 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
          <Drawer.Viewport className="fixed z-50 top-0 right-0 h-full w-full max-w-lg">
            <Drawer.Popup className="bg-white shadow-2xl outline-none h-full transition-transform duration-300 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full">
              <div className="h-full overflow-auto">
                <div className="flex items-start justify-between p-6 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {manifest.name}
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      v{manifest.version}
                    </span>
                  </div>
                  <Drawer.Close className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
                    <X size={18} />
                  </Drawer.Close>
                </div>
                <Drawer.Title className="sr-only">{t('title')}</Drawer.Title>
                <Drawer.Description className="sr-only">
                  {manifest.description}
                </Drawer.Description>
                <div className="px-6 pb-8 space-y-6">
                  <DetailBody manifest={manifest} />
                </div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[85vh] bg-white rounded-xl shadow-xl outline-none transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 overflow-auto">
          <Dialog.Title className="sr-only">{t('title')}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {manifest.description}
          </Dialog.Description>
          <div className="flex items-start justify-between p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {manifest.name}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                v{manifest.version}
              </span>
            </div>
            <Dialog.Close className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="px-6 pb-8 space-y-6">
            <DetailBody manifest={manifest} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
