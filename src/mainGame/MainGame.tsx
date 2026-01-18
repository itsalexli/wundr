import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from '../shared/useInputController'
import { Sprite } from '../shared/Sprite'
import { staticSprites, SPRITE_SIZE, PLAYER_SIZE } from './gameConfig'
import type { UserAnswers } from '../choosingGame/MainChoosingGame'
import { BattleScreen } from './BattleScreen'
import { matchBackground, type BackgroundImage } from './backgroundMatcher'

// Hello Kitty Assets
import hkDown from '../assets/hellokitty/hk-down.png'
import hkDownWalk from '../assets/hellokitty/hk-down-walking.png'
import hkUp from '../assets/hellokitty/hk-up.png'
import hkUpWalk from '../assets/hellokitty/hk-up-walking.png'
import hkLeft from '../assets/hellokitty/hk-left.png'
import hkLeftWalk from '../assets/hellokitty/hk-left-walking.png'
import hkRight from '../assets/hellokitty/hk-right.png'
import hkRightWalk from '../assets/hellokitty/hk-right-walking.png'

interface MainGameProps {
  userAnswers: UserAnswers;
  onBack: () => void;
}

function MainGame({ userAnswers, onBack }: MainGameProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('down')
  const [isMoving, setIsMoving] = useState(false)
  const [frameToggle, setFrameToggle] = useState(false) // For animation

  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [background, setBackground] = useState<BackgroundImage | null>(null)
  const [, setIsLoadingBg] = useState(false)
  const keysPressed = useInputController()

  // Match background on mount based on user's answer
  useEffect(() => {
    if (userAnswers?.background) {
      setIsLoadingBg(true)
      matchBackground(userAnswers.background)
        .then(matched => {
          setBackground(matched)
          setIsLoadingBg(false)
        })
        .catch(err => {
          console.error('Background matching failed:', err)
          setIsLoadingBg(false)
        })
    }
  }, [userAnswers?.background])

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

    // Animation Frame Counter
    let frameCount = 0;
    let prevDirection: 'up' | 'down' | 'left' | 'right' = 'down';
    let prevMoving = false;

    const gameLoop = () => {
      // Toggle animation frame every ~200ms (assuming 60fps, equal to ~12 frames)
      frameCount++;
      if (frameCount >= 10) {
        frameCount = 0;
        setFrameToggle(prev => !prev);
      }

      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        let isNowMoving = false;
        let newDir = prevDirection; // Temporary var to track direction change in loop

        if (keysPressed.current.has('ArrowUp')) {
          newY -= speed;
          newDir = 'up';
          isNowMoving = true;
        }
        if (keysPressed.current.has('ArrowDown')) {
          newY += speed;
          newDir = 'down';
          isNowMoving = true;
        }
        if (keysPressed.current.has('ArrowLeft')) {
          newX -= speed;
          newDir = 'left';
          isNowMoving = true;
        }
        if (keysPressed.current.has('ArrowRight')) {
          newX += speed;
          newDir = 'right';
          isNowMoving = true;
        }

        // Only update state if changed to avoid excessive renders
        if (newDir !== prevDirection) setDirection(newDir);
        if (isNowMoving !== prevMoving) setIsMoving(isNowMoving);

        prevDirection = newDir;
        prevMoving = isNowMoving;

        // Boundary Check
        newX = Math.max(0, Math.min(newX, window.innerWidth - PLAYER_SIZE));
        newY = Math.max(0, Math.min(newY, window.innerHeight - PLAYER_SIZE));

        checkCollision(newX, newY);

        return { x: newX, y: newY };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu]);

  const activeSprite = staticSprites.find(s => s.id === activeMenu);

  // Build background style
  const backgroundStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    ...(background && {
      backgroundImage: `url(/src/assets/backgrounds/${background.filename})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    })
  }

  return (
    <div style={backgroundStyle}>
      {/* Battle Screen Overlay takes full precedence if active */}
      {activeMenu && activeSprite ? (
        <BattleScreen
          enemy={activeSprite}
          learningMaterial={userAnswers.learningMaterial}
          ageLevel={userAnswers.ageLevel}
          onClose={() => {
            setActiveMenu(null)
            // Nudge player away to avoid immediate re-collision
            setPosition(prev => ({
              x: prev.x < activeSprite.x ? prev.x - 10 : prev.x + 10,
              y: prev.y < activeSprite.y ? prev.y - 10 : prev.y + 10
            }))
          }}
        />
      ) : (
        <>
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                padding: '10px 20px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                zIndex: 1000
              }}
            >
              ← Back to Choices
            </button>
          )}



          {/* Player */}
          <Sprite 
            x={position.x} 
            y={position.y} 
            color="red" 
            size={userAnswers.generatedSprites ? PLAYER_SIZE * 1.5 : PLAYER_SIZE}
            image={
              userAnswers.generatedSprites
                ? (direction === 'up' ? userAnswers.generatedSprites.back
                  : direction === 'left' ? userAnswers.generatedSprites.left
                  : direction === 'right' ? userAnswers.generatedSprites.right
                  : userAnswers.generatedSprites.front)
                : (direction === 'up' 
                  ? (isMoving && frameToggle ? hkUpWalk : hkUp)
                  : direction === 'left'
                  ? (isMoving && frameToggle ? hkLeftWalk : hkLeft)
                  : direction === 'right'
                  ? (isMoving && frameToggle ? hkRightWalk : hkRight)
                  : (isMoving && frameToggle ? hkDownWalk : hkDown))
            }

          />

          {/* Static Sprites */}
          {staticSprites.map((sprite, i) => (
            <Sprite key={i} x={sprite.x} y={sprite.y} color={sprite.color} size={SPRITE_SIZE} />
          ))}
        </>
      )}
    </div>
  )
}

export default MainGame
