import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainChoosingGame from './ChoosingGame/MainChoosingGame.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainChoosingGame />
  </StrictMode>,
)
