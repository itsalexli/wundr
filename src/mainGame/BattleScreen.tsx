import React, { useState, useEffect } from 'react';
import { SPRITE_SIZE, type StaticSprite } from './gameConfig';
import { QuestionScreen } from './QuestionScreen';
import { initializeQuestionBank, getNextQuestion, recordResult, isQuestionBankReady, type AgeLevel } from './questionBank';
import type { Question } from './questionGenerator';
import type { BackgroundImage } from './backgroundMatcher';
import { Inventory } from './Inventory';
import health0 from '../assets/healthbar/0.png'
import health25 from '../assets/healthbar/25.png'
import health50 from '../assets/healthbar/50.png'
import health75 from '../assets/healthbar/75.png'
import health100 from '../assets/healthbar/100.png'
import victoryImg from '../assets/screenPopups/victory.png'
import defeatImg from '../assets/screenPopups/defeat.png'
import fireballImg from '../assets/buttons/fireballButton.png'
import iceShardImg from '../assets/buttons/iceShardButton.png'
import lightningImg from '../assets/buttons/lightingButton.png'
import boulderImg from '../assets/buttons/boulderButton.png'
import candyLandBg from '../assets/battleBackgrounds/candy_land.png'
import cherryBlossomGardenBg from '../assets/battleBackgrounds/cheery_blossom_garden.png'
import cityTorontoBg from '../assets/battleBackgrounds/city_toronto.png'
import enchantedGardenBg from '../assets/battleBackgrounds/enchanted_garden.png'
import tropicalJungleBg from '../assets/battleBackgrounds/tropical_jungle.png'
import desertSandDunesBg from '../assets/battleBackgrounds/desert_sand_dunes.png'
import rainbowFieldBg from '../assets/battleBackgrounds/rainbow_field.png'
import oceanSunsetBeachBg from '../assets/battleBackgrounds/ocean_sunset_beach.png'
import snowyMountainPeakBg from '../assets/battleBackgrounds/snowy_mountain_peak.png'
import spaceNebulaBg from '../assets/battleBackgrounds/space_nebula.png'
import sunnyMeadowClearingBg from '../assets/battleBackgrounds/sunny_meadow_clearing.png'

interface BattleScreenProps {
  enemy: StaticSprite;
  learningMaterial?: string;
  ageLevel?: AgeLevel;
  onClose: (result?: 'win' | 'loss') => void;
  inventoryItems?: string[];
  playerHP: number;
  setPlayerHP: React.Dispatch<React.SetStateAction<number>>;
  onUseItem: (item: string, index: number) => void;
  playerImage?: string;
  background?: BackgroundImage | null;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  color: string;
  stopped?: boolean;
}

// Helper to get health image based on HP
const getHealthImage = (hp: number) => {
  if (hp >= 100) return health100;
  if (hp >= 75) return health75;
  if (hp >= 50) return health50;
  if (hp >= 25) return health25;
  return health0;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  enemy, learningMaterial, ageLevel = '6-7',
  onClose,
  inventoryItems = [],
  playerHP,
  setPlayerHP,
  onUseItem,
  playerImage,
  background
}) => {
  const [activeSpell, setActiveSpell] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [isEnemyHurt, setIsEnemyHurt] = useState(false);
  const [isPlayerHurt, setIsPlayerHurt] = useState(false);

  // playerHP is now controlled by props
  const [enemyHP, setEnemyHP] = useState(100);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  
  const [battleResult, setBattleResult] = useState<'win' | 'loss' | null>(null);

  // Map main game backgrounds to battle backgrounds
  const getBattleBackground = (mainBackground: BackgroundImage | null) => {
    if (!mainBackground) return sunnyMeadowClearingBg; // Default to sunny meadow

    const filename = mainBackground.filename;
    switch (filename) {
      case 'sunny_meadow_clearing.png':
        return sunnyMeadowClearingBg; // Bright, happy backgrounds
      case 'rainbow_field.png':
        return rainbowFieldBg; // Bright, happy backgrounds
      case 'candy_land.png':
        return candyLandBg; // Bright, happy backgrounds
      case 'ocean_sunset_beach.png':
        return oceanSunsetBeachBg; // Ocean/beach themes
      case 'tropical_jungle.png':
        return tropicalJungleBg; // Tropical/ocean themes
      case 'snowy_mountain_peak.png':
        return snowyMountainPeakBg; // Winter/mountain themes
      case 'city_toronto.png':
        return cityTorontoBg; // Urban themes
      case 'cherry_blossom_garden.png':
        return cherryBlossomGardenBg; // Garden/flower themes
      case 'enchanted_garden.png':
        return enchantedGardenBg; // Enchanted/magical themes
      case 'desert_sand_dunes.png':
        return desertSandDunesBg; // Desert themes
      case 'space_nebula.png':
        return spaceNebulaBg; // Space themes
      default:
        return sunnyMeadowClearingBg; // Default fallback to sunny meadow
    }
  };
  const [isBankReady, setIsBankReady] = useState(false);

  // Initialize question bank on mount
  useEffect(() => {
    if (learningMaterial) {
      initializeQuestionBank(learningMaterial, ageLevel, 15)
        .then(() => {
          setIsBankReady(true);
          console.log('Question bank ready!');
        })
        .catch(err => console.error('Failed to initialize question bank:', err));
    }
  }, [learningMaterial, ageLevel]);

  // Check for Win/Loss
  useEffect(() => {
    if (battleResult) return; // Already decided

    if (enemyHP <= 0) {
      setTimeout(() => {
        setBattleResult('win');
      }, 500); // Wait for animations
    } else if (playerHP <= 0) {
      setTimeout(() => {
        setBattleResult('loss');
      }, 500); // Wait for animations
    }
  }, [enemyHP, playerHP, battleResult]);

  const enemyRef = React.useRef<HTMLDivElement>(null);

  // Projectile Animation Loop
  useEffect(() => {
    if (projectiles.length === 0) return;

    const animationId = requestAnimationFrame(() => {
      let hitOccurred = false;

      // We need to access the latest state in the setter to avoid closure staleness if not careful,
      // but 'projectiles' is in dep array, so it is fresh.
      const enemyRect = enemyRef.current?.getBoundingClientRect();

      const nextProjectiles = projectiles
        .map(p => {
          if (p.stopped) return p;

          let nextX = p.x + 10;
          let stopped = false;

          // Check collision with enemy
          if (enemyRect && nextX + 10 >= enemyRect.left) {
            stopped = true;
            hitOccurred = true;
          }

          return { ...p, x: nextX, stopped };
        })
        .filter(p => !p.stopped && p.x < window.innerWidth);

        if (hitOccurred) {
          // Reduce enemy HP by 25 (4 hits to kill) instead of arbitrary amount
          setEnemyHP(prev => {
            if (prev <= 25) return 0;
            if (prev <= 50) return 25;
            if (prev <= 75) return 50;
            return 75;
          });
          setIsEnemyHurt(true);
          setTimeout(() => setIsEnemyHurt(false), 200);
        }
      
      setProjectiles(nextProjectiles);
    });

    return () => cancelAnimationFrame(animationId);
  }, [projectiles]);

  const handleSpellComplete = (correct?: boolean) => {
    const spell = activeSpell;
    setActiveSpell(null);

    // Record result to question bank
    if (currentQuestion) {
      recordResult(currentQuestion, correct === true);
      setCurrentQuestion(null);
    }

    if (correct && spell) {
      let color = 'white';
      if (spell === 'Fireball') color = 'red';
      else if (spell === 'Ice Shard') color = 'blue';
      else if (spell === 'Lightning') color = 'yellow';
      else if (spell === 'Boulder') color = 'grey';

      const newProjectile: Projectile = {
        id: Date.now(),
        x: window.innerWidth * 0.1 + 250, // Start from right edge of player sprite
        y: window.innerHeight / 2,
        color
      };

      setProjectiles(prev => [...prev, newProjectile]);
    } else if (!correct) {
      setTimeout(() => {
        setIsPlayerHurt(true);
        // Damage player by one tier
        setPlayerHP(prev => {
          if (prev <= 25) return 0;
          if (prev <= 50) return 25;
          if (prev <= 75) return 50;
          if (prev <= 100) return 75;
          return prev;
        });
        setTimeout(() => setIsPlayerHurt(false), 200);
      }, 300);
    }
  };

  // Handle spell button click - fetch question from bank first
  const handleSpellClick = (spell: string) => {
    if (isQuestionBankReady()) {
      const question = getNextQuestion();
      setCurrentQuestion(question);
    }
    setActiveSpell(spell);
  };

  if (activeSpell) {
    return (
      <QuestionScreen
        spellName={activeSpell}
        learningMaterial={learningMaterial}
        ageLevel={ageLevel}
        preloadedQuestion={currentQuestion}
        onClose={handleSpellComplete}
      />
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `url(${getBattleBackground(background || null)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.9)', // Fallback / Blend if needed
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <h1 style={{ marginBottom: '50px', marginTop: '50px' }}>Player VS {enemy.title}</h1>

      {/* Projectiles Layer */}
      {projectiles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: '20px',
            height: '20px',
            backgroundColor: p.color,
            // borderRadius: '50%', // Optional: make round or keep square? User said "pixel square"
            zIndex: 150
          }}
        />
      ))}

      <div style={{
        display: 'flex',
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '450px',
        flex: 1, // Take up available vertical space to center content
        marginBottom: '-180px'
      }}>
        {/* Player Side - Left */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Player HP Bar Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <img 
              src={getHealthImage(playerHP)} 
              alt={`${playerHP}% Health`}
              style={{
                width: '200px',
                height: 'auto',
                imageRendering: 'pixelated'
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 2px black'
            }}>
              {playerHP}/100
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            filter: isPlayerHurt ? 'drop-shadow(0 0 10px red)' : 'none', // Red hue/glow effect
            transition: 'filter 0.1s ease-in-out'
          }}>
            {/* Scaled up player sprite representation */}
            {playerImage ? (
              <div style={{
                width: SPRITE_SIZE * 3, // Slightly larger for battle view
                height: SPRITE_SIZE * 3,
                backgroundImage: `url(${playerImage})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundColor: isPlayerHurt ? '#ffaaaa' : 'transparent',
                transition: 'background-color 0.1s ease-in-out'
              }} />
            ) : (
              <div style={{
                width: SPRITE_SIZE * 2,
                height: SPRITE_SIZE * 2,
                backgroundColor: isPlayerHurt ? '#ffaaaa' : 'red', // Tint red when hurt
                transition: 'background-color 0.1s ease-in-out'
              }} />
            )}
          </div>
        </div>


        {/* Enemy Side - Right */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Enemy HP Bar Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <img 
              src={getHealthImage(enemyHP)} 
              alt={`${enemyHP}% Health`}
              style={{
                width: '200px',
                height: 'auto',
                imageRendering: 'pixelated'
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 2px black'
            }}>
              {enemyHP}/100
            </span>
          </div>

          <div ref={enemyRef} style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            filter: isEnemyHurt ? 'drop-shadow(0 0 10px red)' : 'none', // Red hue/glow effect
            transition: 'filter 0.1s ease-in-out'
          }}>
            {enemy.image ? (
               <div style={{
                width: SPRITE_SIZE * 3, // Make image slightly larger for battle
                height: SPRITE_SIZE * 3,
                backgroundImage: `url(${enemy.image})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundColor: isEnemyHurt ? '#ffaaaa' : 'transparent', 
                transition: 'background-color 0.1s ease-in-out'
               }} />
            ) : (
            <div style={{
              width: SPRITE_SIZE * 2,
              height: SPRITE_SIZE * 2,
              backgroundColor: isEnemyHurt ? '#ffaaaa' : enemy.color, // Tint the sprite itself slightly red too
              transition: 'background-color 0.1s ease-in-out'
            }} />
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '5px',
        marginTop: 'auto',
        marginBottom: '20px',
        width: '90%',
        justifyContent: 'center'
      }}>
        {['Fireball', 'Ice Shard', 'Lightning', 'Boulder'].map((spell) => {
          const getSpellButtonImage = (spellName: string) => {
            switch (spellName) {
              case 'Fireball': return fireballImg;
              case 'Ice Shard': return iceShardImg;
              case 'Lightning': return lightningImg;
              case 'Boulder': return boulderImg;
              default: return fireballImg;
            }
          };

          return (
            <button
              key={spell}
              onClick={() => handleSpellClick(spell)}
              disabled={!isBankReady && !!learningMaterial}
              style={{
                width: '300px',
                height: '300px',
                backgroundImage: `url(${getSpellButtonImage(spell)})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: (!isBankReady && learningMaterial) ? 'wait' : 'pointer',
                opacity: (!isBankReady && learningMaterial) ? 0.5 : 1,
                flex: 1,
                maxWidth: '300px'
              }}
              title={spell}
            />
          );
        })}
      </div>

      <button
        onClick={() => onClose(undefined)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Run Away
      </button>

      {/* Inventory Button */}
      <button
        onClick={() => setIsInventoryOpen(true)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px', // Moved to left side top to avoid conflict with run away
          width: '50px',
          height: '50px',
          backgroundColor: '#8B4513',
          border: '2px solid #D2691E',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 1000
        }}
        title="Open Inventory"
      />

      {/* Inventory Modal */}
      {isInventoryOpen && (
        <Inventory 
          onClose={() => setIsInventoryOpen(false)} 
          items={inventoryItems} 
          onUseItem={onUseItem}
        />
      )}

      {/* Result Popup Overlay */}
      {battleResult && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img 
              src={battleResult === 'win' ? victoryImg : defeatImg} 
              alt={battleResult === 'win' ? 'VICTORY!' : 'DEFEAT...'}
              style={{
                maxWidth: '80vw',
                maxHeight: '60vh',
                objectFit: 'contain'
              }}
            />
            <button
              onClick={() => onClose(battleResult)}
              style={{
                marginTop: '20px',
                padding: '15px 30px',
                fontSize: '24px',
                backgroundColor: battleResult === 'win' ? '#4CAF50' : '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              {battleResult === 'win' ? 'Continue' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
