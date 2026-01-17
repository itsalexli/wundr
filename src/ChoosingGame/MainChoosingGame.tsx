import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from '../shared/useInputController'
import { Sprite } from '../shared/Sprite'
import { staticSprites, SPRITE_SIZE, type StaticSprite } from './gameConfig'
import { PromptModal } from './PromptModal'
import progressBar0 from '../assets/images/progressBar0.png'
import progressBar1 from '../assets/images/progressBar1.png'
import progressBar2 from '../assets/images/progressBar2.png'
import progressBar3 from '../assets/images/progressBar3.png'
import choosingBackground from '../assets/images/choosingBackground.png'
import defaultLeftImg from '../assets/defaultleft.png'
import defaultRightImg from '../assets/defaultright.png'

// Progress bar images array (0 = empty, 3 = full)
const progressBarImages = [progressBar0, progressBar1, progressBar2, progressBar3];

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
  const [position, setPosition] = useState({ x: 575, y: 725 })
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [answers, setAnswers] = useState<UserAnswers>({})
  const keysPressed = useInputController()

  // Game Loop
  useEffect(() => {
    if (activeMenu) return; // Pause game loop when menu is open

    let animationFrameId: number;
    const speed = 4; // pixels per frame

    const checkCollision = (xp: number, yp: number) => {
      for (const sprite of staticSprites) {
        const spriteSize = sprite.size || SPRITE_SIZE / 1.5;
        if (
          xp < sprite.x + spriteSize &&
          xp + SPRITE_SIZE > sprite.x &&
          yp < sprite.y + spriteSize &&
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
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a1a2e'
    }}>
      <div style={{
        width: '1200px',
        height: '800px',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `url(${choosingBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
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
          <Sprite key={sprite.id} x={sprite.x} y={sprite.y} color={sprite.color} size={sprite.size || SPRITE_SIZE} image={sprite.image} />
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
            width={activeSprite.id === 'character' ? '80%' : undefined}
            height={activeSprite.id === 'character' ? '80%' : undefined}
            layout={activeSprite.id === 'character' ? 'split' : 'default'}
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

        {/* Progress Bar - Dynamic based on answers submitted */}
        <img
          src={progressBarImages[Math.min(Object.keys(answers).length, 3)]}
          alt={`Progress: ${Object.keys(answers).length}/3`}
          style={{
            position: 'absolute',
            top: '45px',
            left: '20px',
            width: '200px',
            zIndex: 50,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  )
}

export default ChoosingGame
