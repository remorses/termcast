import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './custom-elements.ts'

createRoot(document.getElementById('root')!).render(<App />)
