import { useState, useEffect, useRef } from 'react'
import '../App.css'
import DictationTool from './DictationTool'

function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const keysPressed = useRef(new Set<string>())

  // Track keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current.add(e.key);
    }
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const speed = 5; // pixels per frame (smooth)
    const cubeSize = 50;

    const gameLoop = () => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (keysPressed.current.has('ArrowUp')) newY -= speed;
        if (keysPressed.current.has('ArrowDown')) newY += speed;
        if (keysPressed.current.has('ArrowLeft')) newX -= speed;
        if (keysPressed.current.has('ArrowRight')) newX += speed;

        // Collision Detection (Boundary Check)
        // Ensure newX is between 0 and (windowWidth - cubeSize)
        // Ensure newY is between 0 and (windowHeight - cubeSize)
        newX = Math.max(0, Math.min(newX, window.innerWidth - cubeSize));
        newY = Math.max(0, Math.min(newY, window.innerHeight - cubeSize));

        return { x: newX, y: newY };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
      <DictationTool />
      <div
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: 'red',
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${position.x}px, ${position.y}px)`,
          // Removed transition for instant response in game loop
        }}
      />
    </div>
  )
}

export default App