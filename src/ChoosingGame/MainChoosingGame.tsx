import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from '../shared/useInputController'
import { Sprite } from '../shared/Sprite'
import { staticSprites, SPRITE_SIZE, type StaticSprite } from './gameConfig'
import { PromptModal } from './PromptModal'
import { AGE_LEVELS, type AgeLevel } from '../mainGame/questionBank'
import progressBar0 from '../assets/images/progressBar0.png'
import progressBar1 from '../assets/images/progressBar1.png'
import progressBar2 from '../assets/images/progressBar2.png'
import progressBar3 from '../assets/images/progressBar3.png'
import choosingBackground from '../assets/images/choosingBackground.png'
import defaultLeftImg from '../assets/images/defaultleft.png'
import defaultRightImg from '../assets/images/defaultright.png'
import hkLeft from '../assets/hellokitty/hk-left.png'
import hkRight from '../assets/hellokitty/hk-right.png'
import hkUp from '../assets/hellokitty/hk-up.png'
import hkDown from '../assets/hellokitty/hk-down.png'
import characterDesignerBg from '../assets/_designer_ popups/character designer.png'
import characterShowcaseBg from '../assets/_designer_ popups/character designer (Character showcase).png'
import backgroundDesignerBg from '../assets/_designer_ popups/background designer.png'
import soundDesignerBg from '../assets/_designer_ popups/sound designer.png'
import exitButtonImg from '../assets/_designer_ popups/exitbutton.png'
import portalBackgroundImg from '../assets/portal/portalbackground.png'
import uploadTextButtonImg from '../assets/portal/uploadtextbutton.png'
import enterPortalButtonImg from '../assets/portal/enterportalbutton.png'
import DrawingCanvas from './DrawingCanvas';

// Progress bar images array (0 = empty, 3 = full)
const progressBarImages = [progressBar0, progressBar1, progressBar2, progressBar3];

// Store user answers
export interface UserAnswers {
  character?: string;
  music?: string;
  background?: string;
  generatedSprites?: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
  learningMaterial?: string;  // Study material for quiz questions
  ageLevel?: AgeLevel;  // Age-level difficulty for questions
}

interface ChoosingGameProps {
  onEnterPortal?: (answers: UserAnswers) => void;
}

function ChoosingGame({ onEnterPortal }: ChoosingGameProps) {
  const [position, setPosition] = useState({ x: 575, y: 725 })
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'down'>('right')
  const [characterType, setCharacterType] = useState<'default' | 'hellokitty' | 'custom'>('default')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [, setCurrentInput] = useState('')
  const [modalStep, setModalStep] = useState<'input' | 'loading' | 'review'>('input')
  const [selectedCostume, setSelectedCostume] = useState<string>(hkDown)
  const [generatedSprites, setGeneratedSprites] = useState<{ front: string, back: string, left: string, right: string } | null>(null)
  const [answers, setAnswers] = useState<UserAnswers>({})
  const [learningMaterial, setLearningMaterial] = useState('')
  const [ageLevel, setAgeLevel] = useState<AgeLevel>('6-7')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const keysPressed = useInputController()


  // Game Loop
  useEffect(() => {
    if (activeMenu) return; // Pause game loop when menu is open

    let animationFrameId: number;
    const speed = 4; // pixels per frame



    // Temporary storage for generated sprites before they are reviewed/accepted
    // We keep them even if menu closes so we can show the checkmark
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
          setCurrentInput('') // Reset input when opening menu
          setModalStep('input')
          setSelectedCostume(hkDown) // Reset costume selection
          
          // Only reset generated sprites if we are colliding with the character portal to start fresh,
          // OR if we want that behavior. The user didn't specify resetting on re-entry, 
          // but usually you want to start fresh if you enter the portal again.
          // However, if we preserve it for the checkmark, we should be careful.
          // Let's reset ONLY if we don't have a pending checkmark awaiting review.
          // Actually, standard behavior: Entering portal = new attempt.
          if (sprite.id === 'character') {
             setGeneratedSprites(null)
          }
        }
      }
    }

    const gameLoop = () => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (keysPressed.current.has('ArrowUp')) {
          newY -= speed;
          setDirection('up');
        }
        if (keysPressed.current.has('ArrowDown')) {
          newY += speed;
          setDirection('down');
        }
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
    setCurrentInput('')
    setModalStep('input')
    setSelectedCostume(hkDown)
    // Do NOT clear generatedSprites here, so we can show the checkmark
    
    // Nudge player away to prevent immediate re-collision
    setPosition(prev => ({
      x: prev.x < sprite.x ? prev.x - 10 : prev.x + 10,
      y: prev.y < sprite.y ? prev.y - 10 : prev.y + 10
    }))
  }

  const handleSubmit = async (sprite: StaticSprite, answer: string) => {
    // Special flow for character selection
    if (sprite.id === 'character') {
      if (modalStep === 'input') {
        // Hello Kitty Flow
        const lowerAnswer = answer.toLowerCase();
        if (lowerAnswer.includes('hello kitty') || lowerAnswer.includes('hellokitty') || lowerAnswer.includes('kitty')) {
            setModalStep('loading')
            setTimeout(() => {
                setModalStep('review')
                setCharacterType('hellokitty')
                setSelectedCostume(hkDown)
            }, 1500)
            return;
        }

        // Nano Banana / Gemini Flow - BACKGROUND GENERATION
        // Close modal immediately and start generation
        handleClose(sprite);
        setIsGenerating(true); 
        
        // Use a detached promise for background work
        fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: answer })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.paths) {
                setGeneratedSprites({
                    front: data.paths.front,
                    back: data.paths.back,
                    left: data.paths.left,
                    right: data.paths.right
                });
                // REMOVED: setCharacterType('custom'); -- Wait for confirmation!
                 setSelectedCostume(data.paths.front);
                // Ready for review! Checkmark will appear.
            } else {
                console.error('Generation failed:', data.error);
                alert('Failed to generate character. Try again!');
            }
        })
        .catch(e => {
            console.error('API Error:', e);
            alert('Something went wrong contacting Nano Banana!');
        })
        .finally(() => {
            setIsGenerating(false); 
        });
        
        return; 
      }
      
      if (modalStep === 'loading') return // Ignore clicks during loading
      
      // If modalStep === 'review', proceed to confirm/save
    }

    // Save the answer based on sprite id
    setAnswers(prev => ({
      ...prev,
      [sprite.id]: answer,
      // If we generated sprites, save them too
      ...(sprite.id === 'character' && generatedSprites ? { generatedSprites } : {})
    }))

    // Check for Hello Kitty easter egg or Custom character
    if (sprite.id === 'character') {
      const lowerAnswer = answer.toLowerCase();
      if (lowerAnswer.includes('hello kitty') || lowerAnswer.includes('hellokitty') || lowerAnswer.includes('kitty')) {
        setCharacterType('hellokitty');
      } else if (generatedSprites && (modalStep === 'review' || answers.generatedSprites)) {
        // Only switch to custom if we are confirming review OR if we already have it saved
        setCharacterType('custom');
      } else {
        setCharacterType('default');
      }
    }

    console.log(`Answer for ${sprite.id}:`, answer)
    handleClose(sprite)
  }

  const handlePaintClick = () => {
    setIsDrawing(true);
  };

  const handleDrawingSubmit = (imageBase64: string) => {
    setIsDrawing(false);
    
    // Close the character prompt modal if open
    const charSprite = staticSprites.find(s => s.id === 'character');
    if (charSprite) handleClose(charSprite);

    setIsGenerating(true);
    
    // Detached fetch for background generation
    fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt: "Refine this sketch into a pixel art character", 
            image: imageBase64 
        }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.paths) {
        setGeneratedSprites({
          front: data.paths.front,
          back: data.paths.back,
          left: data.paths.left,
          right: data.paths.right
        });
        setSelectedCostume(data.paths.front);
        // Do NOT setModalStep('review') here. Checkmark will handle it.
      } else {
        console.error('Generation failed:', data.error);
        alert(`Failed to generate sprites: ${data.error}`);
      }
    })
    .catch(error => {
      console.error('Network error:', error);
      alert('Network error. Please try again.');
    })
    .finally(() => {
        setIsGenerating(false);
    });
  };

  // Easter Egg & Custom Content Logic
  const isHelloKitty = characterType === 'hellokitty';
  // const isCustom = characterType === 'custom' && (generatedSprites || answers.generatedSprites);
  
  const showVisuals = activeSprite?.id === 'character' && modalStep === 'review';

  const leftPaneContent = showVisuals ? (
    <img src={selectedCostume} alt="Character Preview" style={{ width: '80%', height: 'auto', objectFit: 'contain', imageRendering: 'pixelated', marginLeft: '100px' }} />
  ) : undefined;

  let costumes: string[] = [];
  if (isHelloKitty) {
      costumes = [hkDown, hkLeft, hkUp, hkRight];
  } else if (characterType === 'custom' || (modalStep === 'review' && generatedSprites)) { 
      // Show custom sprites if confirmed OR if we are reviewing them
      const sprites = generatedSprites || answers.generatedSprites;
      if (sprites) {
        costumes = [sprites.front, sprites.left, sprites.back, sprites.right];
      }
  }

  const rightPaneContent = showVisuals ? (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)', 
      gap: '16px', 
      marginBottom: '90px',
      marginLeft: '90px', 
      justifyItems: 'center',
      width: 'fit-content',
      margin: '0 auto 24px auto'
    }}>
      {costumes.map((costume, index) => (
        <img 
          key={index}
          src={costume} 
          alt={`Costume ${index}`} 
          style={{ 
            width: '60px', 
            height: '60px', 
            objectFit: 'contain',
            cursor: 'pointer',
            border: selectedCostume === costume ? '2px solid #4a90d9' : '2px solid transparent',
            borderRadius: '8px',
            padding: '4px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            imageRendering: 'pixelated'
          }}
          onClick={() => setSelectedCostume(costume)}
        />
      ))}
    </div>
  ) : undefined;

  // Resolve the sprite to use for the player in the lobby
  // CRITICAL FIX: Only use confirmed sprites (answers.generatedSprites) for the actual player
  // prevent using the "preview" generatedSprites (which is for the modal only)
  const lobbySprite = characterType === 'custom' ? answers.generatedSprites : null;

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
          size={characterType === 'custom' ? SPRITE_SIZE * 1.5 : SPRITE_SIZE}
          image={
            characterType === 'hellokitty'
              ? (direction === 'up' ? hkUp
                : direction === 'down' ? hkDown
                : direction === 'left' ? hkLeft
                : hkRight)
              : characterType === 'custom' && lobbySprite
              ? (direction === 'up' ? lobbySprite.back
                : direction === 'down' ? lobbySprite.front
                : direction === 'left' ? lobbySprite.left
                : lobbySprite.right)
              : (direction === 'left' ? defaultLeftImg : defaultRightImg)
          }
        />

        {/* Static Sprites */}
        {staticSprites.map((sprite) => (
          <Sprite key={sprite.id} x={sprite.x} y={sprite.y} color={sprite.color} size={sprite.size || SPRITE_SIZE} image={sprite.image} />
        ))}

        {/* Portal Modal with Learning Material Upload */}
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
              backgroundImage: `url(${portalBackgroundImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              padding: '32px',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: '600px',
              width: '90%',
              minHeight: '500px'
            }}>

              {/* Text Area for pasting notes */}
              <textarea
                value={learningMaterial}
                onChange={(e) => setLearningMaterial(e.target.value)}
                placeholder="Paste your study notes here..."
                style={{
                  position: 'absolute',
                  left: '502px',
                  top: '275px',
                  width: '425px',
                  height: '127px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  color: 'black',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 10
                }}
              />

              {/* File Upload */}
              <input
                type="file"
                accept=".txt,.md"
                id="fileUpload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      setLearningMaterial(prev => prev + (prev ? '\n\n' : '') + content);
                    };
                    reader.readAsText(file);
                  }
                }}
              />
              <label
                htmlFor="fileUpload"
                style={{
                  position: 'absolute',
                  left: '632px',
                  top: '410px',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={uploadTextButtonImg}
                  alt="Upload Text File"
                  style={{
                    width: '200px',
                    height: 'auto'
                  }}
                />
              </label>

              

              {/* Age Level Selector */}
              <div style={{
                position: 'absolute',
                left: '656px',
                top: '570px',
              }}>
                <select
                  value={ageLevel}
                  onChange={(e) => setAgeLevel(e.target.value as AgeLevel)}
                  style={{
                    padding: '4px 16px',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: 'black',
                    cursor: 'pointer',
                    maxWidth: '150px',
                    maxHeight: '30px'
                  }}
                >
                  {AGE_LEVELS.map(level => (
                    <option key={level} value={level}>
                      Age {level} years
                    </option>
                  ))}
                </select>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  handleClose(activeSprite);
                  setLearningMaterial('');
                }}
                style={{
                  position: 'absolute',
                  top: '170px',
                  right: '450px',
                  width: '60px',
                  height: 'auto',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <img
                  src={exitButtonImg}
                  alt="Close"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '12px 24px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                />
              </button>

              <button
                  onClick={() => onEnterPortal?.({ ...answers, learningMaterial, ageLevel })}
                  disabled={!learningMaterial.trim()}
                  style={{
                    position: 'absolute',
                    left: '632px',
                    top: '585px',
                    background: 'none',
                    border: 'none',
                    cursor: learningMaterial.trim() ? 'pointer' : 'not-allowed',
                    opacity: learningMaterial.trim() ? 1 : 0.5,
                    padding: 0
                  }}
                >
                  <img
                    src={enterPortalButtonImg}
                    alt="Enter Portal"
                    style={{
                      width: '200px',
                      height: 'auto'
                    }}
                />
              </button>
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
            width={
              activeSprite.id === 'character' ? '60%' :
              activeSprite.id === 'background' ? '65%' :
              activeSprite.id === 'music' ? '65%' :
              undefined
            }
            height={
              activeSprite.id === 'character' ? '95%' :
              activeSprite.id === 'background' ? '92%' :
              activeSprite.id === 'music' ? '92%' :
              undefined
            }
            layout={activeSprite.id === 'character' ? 'split' : 'default'}
            onInputChange={setCurrentInput}
            leftPaneContent={leftPaneContent}
            rightPaneContent={rightPaneContent}
            isLoading={modalStep === 'loading'}
            submitLabel={modalStep === 'review' ? 'Confirm' : 'Submit'}
            inputAreaStyle={
              activeSprite.id === 'character' ? {
                marginBottom: '158px',
                marginRight: '95px',
                width: '90%',
                maxWidth: '350px',
                alignSelf: 'center',
              } :
              activeSprite.id === 'background' ? {
                position: 'absolute',
                top: '305px',
                right: '225px',
                width: '85%',
                maxWidth: '350px',
                zIndex: 10,
              } :
              activeSprite.id === 'music' ? {
                position: 'absolute',
                top: '305px',
                right: '225px',
                width: '85%',
                maxWidth: '350px',
                zIndex: 10,
              } : undefined
            }
            backgroundImage={
              activeSprite.id === 'character'
                ? (modalStep === 'review' ? characterShowcaseBg : characterDesignerBg)
                : activeSprite.id === 'background'
                ? backgroundDesignerBg
                : activeSprite.id === 'music'
                ? soundDesignerBg
                : undefined
            }
            textareaStyle={
              activeSprite.id === 'character'
                ? (modalStep === 'review' ? { minHeight: '300px' } : { minHeight: '270px' })
                : activeSprite.id === 'background'
                ? { minHeight: '255px' }
                : activeSprite.id === 'music'
                ? { minHeight: '255px' }
                : undefined
            }
            closeButtonImage={
              activeSprite.id === 'character' ||
              activeSprite.id === 'background' ||
              activeSprite.id === 'music'
                ? exitButtonImg
                : undefined
            }
            closeButtonStyle={
              activeSprite.id === 'character'
                ? { top: '40px', right: '70px' }
                : activeSprite.id === 'background'
                ? { top: '100px', right: '140px' }
                : activeSprite.id === 'music'
                ? { top: '100px', right: '140px' }
                : undefined
            }
            hideInput={activeSprite.id === 'character' && modalStep === 'review'}
            onPaintClick={activeSprite.id === 'character' ? handlePaintClick : undefined}
          />
        )}

        {isDrawing && (
            <DrawingCanvas
                onClose={() => setIsDrawing(false)}
                onSubmit={handleDrawingSubmit}
            />
        )}

        {/* Checkmark Notification for Ready Characters */}
        {/* Checkmark Notification for Ready Characters */}
        {generatedSprites && !activeMenu && (
            <button
                onClick={() => {
                    const charSprite = staticSprites.find(s => s.id === 'character');
                    if (charSprite) {
                        setActiveMenu('character');
                        setModalStep('review');
                        setSelectedCostume(generatedSprites.front);
                    }
                }}
                style={{
                    position: 'absolute',
                    bottom: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#4CAF50',
                    border: '4px solid white',
                    color: 'white',
                    fontSize: '32px',
                    fontFamily: 'monospace', // Monospace for pixelated feel if font is missing
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.5)', // Hard shadow for pixel feel
                    zIndex: 100,
                    imageRendering: 'pixelated', // Hint to browser
                    borderRadius: '0px', // Boxy for pixel look
                    animation: 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)'
                }}
            >
                ✓
            </button>
        )}

        {/* Loading Pixel Animation */}
        {isGenerating && !activeMenu && (
             <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '40px',
                zIndex: 100
             }}>
                 {/* Main pixelated spinner/bouncer using simple CSS divs */}
                 <div style={{
                     width: '20px',
                     height: '20px',
                     backgroundColor: 'white',
                     boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
                     animation: 'spin 1s infinite steps(4)', // Steps for jerky pixel motion
                     margin: 'auto'
                 }} />
                 <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                 `}</style>
                 <div style={{ 
                     textAlign: 'center', 
                     color: 'white', 
                     fontFamily: 'monospace', 
                     fontSize: '10px', 
                     marginTop: '8px',
                     textShadow: '2px 2px 0px #000'
                 }}>
                     GENERATING...
                 </div>
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
