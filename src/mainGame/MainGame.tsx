import { useState, useEffect, useRef } from 'react'
import '../App.css'
import { useInputController } from '../shared/useInputController'
import { Sprite } from '../shared/Sprite'
import { staticSprites as initialSprites, SPRITE_SIZE, PLAYER_SIZE, type StaticSprite } from './gameConfig'
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
import enemy1Img from '../assets/images/enemy1.png'
import enemy2Img from '../assets/images/enemy2.png'
import enemy3Img from '../assets/images/enemy3.png'
import enemy4Img from '../assets/images/enemy4.png'
import potionImg from '../assets/images/potion.png'
import coinImg from '../assets/images/coin.png'
import { Inventory } from './Inventory'

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
  const [isLoadingBg, setIsLoadingBg] = useState(false)
  // State for enemies with randomized positions
  const [gameSprites, setGameSprites] = useState<StaticSprite[]>([])
  const [defeatedCount, setDefeatedCount] = useState(0)
  const [inventoryItems, setInventoryItems] = useState<string[]>([])
  const [playerHP, setPlayerHP] = useState(100) // Lift playerHP state to MainGame
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const keysPressed = useInputController()
  const initialized = useRef(false)

  // Initialize random positions on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const generateRandomPosition = (existingSprites: StaticSprite[]): { x: number, y: number } => {
      const padding = 50; // Padding from screen edges
      const minDistance = 100; // Minimum distance between sprites
      const maxX = window.innerWidth - SPRITE_SIZE - padding;
      const maxY = window.innerHeight - SPRITE_SIZE - padding;
      const minX = padding;
      const minY = padding;

      let attempts = 0;
      while (attempts < 100) {
        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;

        // Check distance from player start position (0,0)
        const distToPlayer = Math.sqrt(Math.pow(x - 0, 2) + Math.pow(y - 0, 2));
        if (distToPlayer < 150) { // Don't spawn too close to player start
          attempts++;
          continue;
        }

        // Check distance from other sprites
        let tooClose = false;
        for (const sprite of existingSprites) {
          const dist = Math.sqrt(Math.pow(x - sprite.x, 2) + Math.pow(y - sprite.y, 2));
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          return { x, y };
        }
        attempts++;
      }
      // Fallback if no position found (should be rare with enough space)
      return { x: Math.random() * (maxX - minX) + minX, y: Math.random() * (maxY - minY) + minY };
    };

    const newSprites: StaticSprite[] = [];
    initialSprites.forEach(template => {
      const pos = generateRandomPosition(newSprites);
      
      // Determine which enemy image to use (randomly distributed among the 4)
      const rand = Math.random();
      let image: string;

      if (rand < 0.25) {
        image = enemy1Img;
      } else if (rand < 0.5) {
        image = enemy2Img;
      } else if (rand < 0.75) {
        image = enemy3Img;
      } else {
        image = enemy4Img;
      }
      
      newSprites.push({ 
        ...template, 
        x: pos.x, 
        y: pos.y,
        image: image // Always assign an image
      });
    });

    setGameSprites(newSprites);
  }, []);

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
    if (activeMenu || isInventoryOpen) return; // Pause game loop when menu/inventory is open

    let animationFrameId: number;
    const speed = 5; // pixels per frame

    const checkCollision = (xp: number, yp: number) => {
      for (const sprite of gameSprites) {
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
  }, [activeMenu, gameSprites, isInventoryOpen]);

  const activeSprite = gameSprites.find(s => s.id === activeMenu);

  const handleUseItem = (item: string, index: number) => {
    // Only allow item usage if NOT in main game (must be in battle) - wait, user said "or if its on the maingame" DO NOT allow?
    // "if the player is at full hp (100hp), or if its on the maingame, do not allow the user to click a potion."
    // This implies potions can ONLY be used in battle AND when hurt.
    
    if (!activeMenu) {
      alert("You can only use items during battle!");
      return;
    }

    if (item.includes('potion')) {
      if (playerHP >= 100) {
        alert("You are already at full health!");
        return;
      }
      
      // Heal player to next tier (0 -> 25 -> 50 -> 75 -> 100)
      setPlayerHP(prev => {
        if (prev < 25) return 25;
        if (prev < 50) return 50;
        if (prev < 75) return 75;
        return 100;
      });
      
      // Remove used item
      setInventoryItems(prev => {
        const newItems = [...prev];
        // We use the index passed from the inventory click to remove exact item
        newItems.splice(index, 1);
        return newItems;
      });
    }
  };

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
          inventoryItems={inventoryItems}
          playerHP={playerHP}
          setPlayerHP={setPlayerHP}
          onUseItem={handleUseItem}
          playerImage={
            userAnswers.generatedSprites
              ? userAnswers.generatedSprites.right // Use right-facing sprite for battle
              : hkRight // Use Hello Kitty right-facing by default
          }
          onClose={(result) => {
            setActiveMenu(null)
            
            if (result === 'win') {
              // Remove defeated enemy and increment counter
              setGameSprites(prev => prev.filter(s => s.id !== activeSprite.id));
              setDefeatedCount(prev => prev + 1);
              
              // Add item to inventory (max 5 potions, then coins)
              setInventoryItems(prev => {
                const potionCount = prev.filter(item => item.includes('potion')).length;
                if (potionCount < 5) {
                  return [...prev, potionImg];
                } else {
                  return [...prev, coinImg];
                }
              });
            } else {
              // Only nudge if player didn't win (e.g. ran away or lost and retrying)
              // Nudge player away to avoid immediate re-collision
              setPosition(prev => ({
                x: prev.x < activeSprite.x ? prev.x - 10 : prev.x + 10,
                y: prev.y < activeSprite.y ? prev.y - 10 : prev.y + 10
              }))

              // If player lost/ran away and has low health, heal to at least 50 (mercy rule)
              setPlayerHP(prev => Math.max(prev, 50));
            }
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

          {/* Inventory Button */}
          <button
            onClick={() => setIsInventoryOpen(true)}
            style={{
              position: 'absolute',
              top: '140px', // Pushed down further to be safely below the stats box
              right: '16px',
              width: '50px',
              height: '50px',
              backgroundColor: '#8B4513', // Brown color
              border: '2px solid #D2691E',
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 1000
            }}
            title="Open Inventory"
          />

          {/* Show user choices if available - OR just show defeat counter if no choices */}
          {((userAnswers && Object.keys(userAnswers).length > 0) || defeatedCount >= 0) && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              zIndex: 1000,
              minWidth: '150px' // Ensure some width so inventory can align nicely below
            }}>
              {isLoadingBg && <div style={{ marginBottom: '8px', color: '#666' }}>Creating world... 🎨</div>}
              {userAnswers && Object.keys(userAnswers).length > 0 && (
                <>
                  <strong>Your choices:</strong>
                  {userAnswers.character && <div>👤 {userAnswers.character}</div>}
                  {userAnswers.music && <div>🎵 {userAnswers.music}</div>}
                  {userAnswers.background && <div>🖼️ {userAnswers.background}</div>}
                </>
              )}
              
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold', color: '#e53935' }}>
                ⚔️ Defeated: {defeatedCount}
              </div>
            </div>
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
          {gameSprites.map((sprite, i) => (
            <Sprite 
              key={i} 
              x={sprite.x} 
              y={sprite.y} 
              color={sprite.color} 
              size={sprite.image ? SPRITE_SIZE * 1.5 : SPRITE_SIZE} 
              image={sprite.image}
            />
          ))}
          
          {/* Inventory Modal */}
          {isInventoryOpen && (
            <Inventory 
              onClose={() => setIsInventoryOpen(false)} 
              items={inventoryItems} 
              onUseItem={handleUseItem}
            />
          )}
        </>
      )}
    </div>
  )
}

export default MainGame
