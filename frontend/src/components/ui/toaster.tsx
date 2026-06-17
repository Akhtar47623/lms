import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastItem extends Required<ToastInput> {
  id: string
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((input: ToastInput) => {
    const id = crypto.randomUUID()
    setToasts((current) => [
      ...current,
      {
        id,
        title: input.title,
        description: input.description ?? '',
        variant: input.variant ?? 'info',
      },
    ])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((item) => {
          const Icon = icons[item.variant]

          return (
            <ToastPrimitive.Root
              key={item.id}
              className={cn(
                'grid w-[calc(100vw-2rem)] max-w-sm grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md border bg-background p-4 shadow-lg',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in',
                item.variant === 'success' && 'border-primary/35',
                item.variant === 'error' && 'border-destructive/35',
                item.variant === 'info' && 'border-border',
              )}
              onOpenChange={(open) => {
                if (!open) removeToast(item.id)
              }}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-5 w-5',
                  item.variant === 'success' && 'text-primary',
                  item.variant === 'error' && 'text-destructive',
                  item.variant === 'info' && 'text-muted-foreground',
                )}
              />
              <div className="min-w-0">
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed right-4 top-4 z-[100] flex max-h-screen flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
