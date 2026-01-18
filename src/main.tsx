import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainGame from './mainGame/MainGame.tsx'
import ChoosingGame from './choosingGame/MainChoosingGame.tsx'
import { LandingPage } from './LandingPage.tsx'
import type { UserAnswers } from './choosingGame/MainChoosingGame.tsx'

type Page = 'landing' | 'choosing' | 'mainGame'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({})

  const handleStartGame = () => {
    setCurrentPage('choosing')
  }

  const handleEnterPortal = (answers: UserAnswers) => {
    setUserAnswers(answers)
    setCurrentPage('mainGame')
  }

  const handleBackToChoosing = () => {
    setCurrentPage('choosing')
  }

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage onStartGame={handleStartGame} />
      )}
      {currentPage === 'choosing' && (
        <ChoosingGame onEnterPortal={handleEnterPortal} />
      )}
      {currentPage === 'mainGame' && (
        <MainGame userAnswers={userAnswers} onBack={handleBackToChoosing} />
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
