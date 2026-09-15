import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { queryClient } from '@/lib/queryClient'
import '@/lib/i18n'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              'border border-border/60 bg-card text-card-foreground shadow-[var(--shadow-soft)] rounded-xl',
            title: 'text-foreground font-semibold',
            description: 'text-muted-foreground',
            actionButton: 'bg-primary text-primary-foreground',
            cancelButton: 'bg-secondary text-secondary-foreground',
          },
        }}
      />
    </QueryClientProvider>
  )
}
