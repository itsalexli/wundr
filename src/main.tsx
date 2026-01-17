import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainGame from './mainGame/MainGame.tsx'
import ChoosingGame from './ChoosingGame/MainChoosingGame.tsx'
import type { UserAnswers } from './ChoosingGame/MainChoosingGame.tsx'

type Page = 'choosing' | 'mainGame'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('choosing')
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({})

  const handleEnterPortal = (answers: UserAnswers) => {
    setUserAnswers(answers)
    setCurrentPage('mainGame')
  }

  const handleBackToChoosing = () => {
    setCurrentPage('choosing')
  }

  return (
    <>
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
