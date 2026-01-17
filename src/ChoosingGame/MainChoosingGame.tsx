import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from './useInputController'
import { Sprite } from './Sprite'
import { staticSprites, SPRITE_SIZE } from './gameConfig'

function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
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
          // Optional: Bounce back slightly to avoid immediate re-trigger on close?
          // For now, simpler is fine, but we might want to ensure we don't get stuck.
        }
      }
    }

    const gameLoop = () => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (keysPressed.current.has('ArrowUp')) newY -= speed;
        if (keysPressed.current.has('ArrowDown')) newY += speed;
        if (keysPressed.current.has('ArrowLeft')) newX -= speed;
        if (keysPressed.current.has('ArrowRight')) newX += speed;

        // Boundary Check
        newX = Math.max(0, Math.min(newX, window.innerWidth - SPRITE_SIZE));
        newY = Math.max(0, Math.min(newY, window.innerHeight - SPRITE_SIZE));

        // Collision Check uses PREDICTED position to stop movement? 
        // Or reactive? Reactive means we overlap. Let's stick effectively to reactive trigger.
        checkCollision(newX, newY);

        return { x: newX, y: newY };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeMenu]); // Re-run effect when activeMenu changes (to start/stop loop)

  const activeSprite = staticSprites.find(s => s.id === activeMenu);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
      {/* Player */}
      <Sprite x={position.x} y={position.y} color="red" size={SPRITE_SIZE} />

      {/* Static Sprites */}
      {staticSprites.map((sprite, i) => (
        <Sprite key={i} x={sprite.x} y={sprite.y} color={sprite.color} size={SPRITE_SIZE} />
      ))}

      {/* Menu Overlay */}
      {activeMenu && activeSprite && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            width: '70%',
            height: '70%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h2>{activeSprite.title}</h2>
            <p>You found a sprite!</p>
            <button
              onClick={() => {
                setActiveMenu(null)
                // Teleport slightly away or ensure we don't get stuck in loop?
                // Just moving 1px away from collision direction would be smart, but for now simple release.
                // Actually, if we are overlapping, game loop immediately re-triggers collision on next frame.
                // We should move the player back to previous valid position or push them out.
                // Let's simple-fix: Reset position slightly away? 
                // Or just ignore collision for a split second?
                // Safest for "ChoosingGame" is usually to just set position to 'safe' adjacent spot or rely on user moving away? 
                // Wait, if I close menu and I'm still overlapping, checking collision happens immediately and reopens menu.
                // I will add a simple 'nudge' to the player position when closing menu to help them escape.
                setPosition(prev => ({
                  x: prev.x < activeSprite.x ? prev.x - 10 : prev.x + 10,
                  y: prev.y < activeSprite.y ? prev.y - 10 : prev.y + 10
                }))
              }}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: activeSprite.color,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App


