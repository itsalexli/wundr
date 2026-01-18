import type { FC } from 'react'
import landingpage from './assets/images/landingpage.png'
import startgame from './assets/images/buttons/startgame.png'

interface LandingPageProps {
  onStartGame: () => void;
}

export const LandingPage: FC<LandingPageProps> = ({ onStartGame }) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${landingpage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '150px',
        position: 'relative'
      }}
    >
      <button
        onClick={onStartGame}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          backgroundImage: `url(${startgame})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          marginTop: '100px',
          width: '800px',
          height: '100px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.transition = 'transform 0.2s ease';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {/* Invisible text for accessibility */}
        <span style={{ position: 'absolute', left: '-9999px' }}>Start Game</span>
      </button>
    </div>
  )
}
