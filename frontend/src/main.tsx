import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App'
import { outbox } from './lib/outbox'
import { persister } from './lib/persister'
import { queryClient } from './lib/queryClient'

const WEEK = 1000 * 60 * 60 * 24 * 7

outbox.init().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: WEEK, buster: 'v1' }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistQueryClientProvider>
    </StrictMode>,
  )
})
