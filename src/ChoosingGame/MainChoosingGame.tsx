import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from '../shared/useInputController'
import { Sprite } from '../shared/Sprite'
import { staticSprites, SPRITE_SIZE, type StaticSprite } from './gameConfig'
import { PromptModal } from './PromptModal'
import progressBarImg from '../assets/progressbar.png'
import defaultLeftImg from '../assets/defaultleft.png'
import defaultRightImg from '../assets/defaultright.png'

// Store user answers
export interface UserAnswers {
  character?: string;
  music?: string;
  background?: string;
}

interface ChoosingGameProps {
  onEnterPortal?: (answers: UserAnswers) => void;
}

function ChoosingGame({ onEnterPortal }: ChoosingGameProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [answers, setAnswers] = useState<UserAnswers>({})
  const keysPressed = useInputController()

    // Game Loop
    useEffect(() => {
      if (activeMenu) return; // Pause game loop when menu is open

      let animationFrameId: number;
      const speed = 5; // pixels per frame

    const checkCollision = (xp: number, yp: number) => {
      for (const sprite of staticSprites) {
        if (
          xp < sprite.x + SPRITE_SIZE &&
          xp + SPRITE_SIZE > sprite.x &&
          yp < sprite.y + SPRITE_SIZE &&
          yp + SPRITE_SIZE > sprite.y
        ) {
          setActiveMenu(sprite.id)
        }
      }
    }

      const gameLoop = () => {
        setPosition(prev => {
          let newX = prev.x;
          let newY = prev.y;

          if (keysPressed.current.has('ArrowUp')) newY -= speed;
          if (keysPressed.current.has('ArrowDown')) newY += speed;
          if (keysPressed.current.has('ArrowLeft')) {
            newX -= speed;
            setDirection('left');
          }
          if (keysPressed.current.has('ArrowRight')) {
            newX += speed;
            setDirection('right');
          }

          // Boundary Check
          newX = Math.max(0, Math.min(newX, window.innerWidth - SPRITE_SIZE));
          newY = Math.max(0, Math.min(newY, window.innerHeight - SPRITE_SIZE));

        checkCollision(newX, newY);

          return { x: newX, y: newY };
        });

        animationFrameId = requestAnimationFrame(gameLoop);
      };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeMenu]);

  const activeSprite = staticSprites.find(s => s.id === activeMenu);

  const handleClose = (sprite: StaticSprite) => {
    setActiveMenu(null)
    // Nudge player away to prevent immediate re-collision
    setPosition(prev => ({
      x: prev.x < sprite.x ? prev.x - 10 : prev.x + 10,
      y: prev.y < sprite.y ? prev.y - 10 : prev.y + 10
    }))
  }

  const handleSubmit = (sprite: StaticSprite, answer: string) => {
    // Save the answer based on sprite id
    setAnswers(prev => ({
      ...prev,
      [sprite.id]: answer
    }))
    console.log(`Answer for ${sprite.id}:`, answer)
    handleClose(sprite)
  }

    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
        {/* Player */}
        <Sprite 
          x={position.x} 
          y={position.y} 
          color="red" 
          size={SPRITE_SIZE} 
          image={direction === 'left' ? defaultLeftImg : defaultRightImg}
        />

      {/* Static Sprites */}
      {staticSprites.map((sprite) => (
        <Sprite key={sprite.id} x={sprite.x} y={sprite.y} color={sprite.color} size={SPRITE_SIZE} />
      ))}

      {/* Portal Modal (no text input) */}
      {activeMenu && activeSprite?.isPortal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 16px', color: '#333' }}>🌀 Portal</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Ready to enter your adventure?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => handleClose(activeSprite)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => onEnterPortal?.(answers)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: activeSprite.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Enter Portal 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal with text/dictation input */}
      {activeMenu && activeSprite && !activeSprite.isPortal && (
        <PromptModal
          prompt={activeSprite.prompt}
          onSubmit={(answer) => handleSubmit(activeSprite, answer)}
          onClose={() => handleClose(activeSprite)}
          placeholder="Type your answer or use the mic..."
        />
      )}

      {/* Debug: Show collected answers */}
      {Object.keys(answers).length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px'
        }}>
          <strong>Your choices:</strong>
          {answers.character && <div>👤 Character: {answers.character}</div>}
          {answers.music && <div>🎵 Music: {answers.music}</div>}
          {answers.background && <div>🖼️ Background: {answers.background}</div>}
        </div>
      )}

      {/* Progress Bar */}
      <img 
        src={progressBarImg} 
        alt="Progress Bar" 
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '500px',
          zIndex: 50,
          pointerEvents: 'none'
        }} 
      />
    </div>
  )
}

export default ChoosingGame
