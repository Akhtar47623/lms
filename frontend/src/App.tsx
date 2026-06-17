import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { router } from '@/routes'
import { ToastProvider } from '@/components/ui/toaster'

export default function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </Provider>
  )
}
