import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainGame from './mainGame/MainGame.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainGame />
  </StrictMode>,
)
