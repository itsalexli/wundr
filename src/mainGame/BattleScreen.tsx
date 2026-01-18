import React, { useState, useEffect } from 'react';
import { SPRITE_SIZE, type StaticSprite } from './gameConfig';
import fillerImage from '../assets/images/filler-image.jpg';
import { QuestionScreen } from './QuestionScreen';
import { initializeQuestionBank, getNextQuestion, recordResult, isQuestionBankReady, type AgeLevel } from './questionBank';
import type { Question } from './questionGenerator';

interface BattleScreenProps {
  enemy: StaticSprite;
  learningMaterial?: string;
  ageLevel?: AgeLevel;
  onClose: () => void;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  color: string;
  stopped?: boolean;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ enemy, learningMaterial, ageLevel = '6-7', onClose }) => {
  const [activeSpell, setActiveSpell] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [isEnemyHurt, setIsEnemyHurt] = useState(false);
  const [isPlayerHurt, setIsPlayerHurt] = useState(false);

  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);

  const [battleResult, setBattleResult] = useState<'win' | 'loss' | null>(null);
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
        setEnemyHP(prev => Math.max(0, prev - 20));
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
      else if (spell === 'Heal') color = 'green';

      const newProjectile: Projectile = {
        id: Date.now(),
        x: window.innerWidth * 0.2,
        y: window.innerHeight / 2,
        color
      };

      setProjectiles(prev => [...prev, newProjectile]);
    } else if (!correct) {
      setTimeout(() => {
        setIsPlayerHurt(true);
        setPlayerHP(prev => Math.max(0, prev - 20));
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
      backgroundImage: `url(${fillerImage})`,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1, // Take up available vertical space to center content
        marginBottom: '50px'
      }}>
        {/* Player Side - Left */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Player HP Bar Container */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '150px',
              height: '20px',
              backgroundColor: '#555',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid white',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: `${playerHP}%`,
                height: '100%',
                backgroundColor: '#4CAF50', // Green HP
                transition: 'width 0.3s ease-out',
                position: 'absolute',
                left: 0,
                top: 0
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '1px 1px 2px black',
                zIndex: 1,
                position: 'relative'
              }}>
                {playerHP}/100
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            filter: isPlayerHurt ? 'drop-shadow(0 0 10px red)' : 'none', // Red hue/glow effect
            transition: 'filter 0.1s ease-in-out'
          }}>
            {/* Scaled up player sprite representation */}
            <div style={{
              width: SPRITE_SIZE * 2,
              height: SPRITE_SIZE * 2,
              backgroundColor: isPlayerHurt ? '#ffaaaa' : 'red', // Tint red when hurt
              transition: 'background-color 0.1s ease-in-out'
            }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '150px',
              height: '20px',
              backgroundColor: '#555',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid white',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: `${enemyHP}%`,
                height: '100%',
                backgroundColor: '#4CAF50', // Green HP
                transition: 'width 0.3s ease-out',
                position: 'absolute',
                left: 0,
                top: 0
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '1px 1px 2px black',
                zIndex: 1,
                position: 'relative'
              }}>
                {enemyHP}/100
              </span>
            </div>
          </div>

          <div ref={enemyRef} style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            filter: isEnemyHurt ? 'drop-shadow(0 0 10px red)' : 'none', // Red hue/glow effect
            transition: 'filter 0.1s ease-in-out'
          }}>
            <div style={{
              width: SPRITE_SIZE * 2,
              height: SPRITE_SIZE * 2,
              backgroundColor: isEnemyHurt ? '#ffaaaa' : enemy.color, // Tint the sprite itself slightly red too
              transition: 'background-color 0.1s ease-in-out'
            }} />
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        marginTop: 'auto',
        marginBottom: '30px',
        width: '90%',
        justifyContent: 'center'
      }}>
        {['Fireball', 'Ice Shard', 'Lightning', 'Heal'].map((spell) => (
          <button
            key={spell}
            onClick={() => handleSpellClick(spell)}
            disabled={!isBankReady && !!learningMaterial}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: (!isBankReady && learningMaterial) ? '#999' : '#4a90e2',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: (!isBankReady && learningMaterial) ? 'wait' : 'pointer',
              flex: 1,
              maxWidth: '200px'
            }}
          >
            {spell}
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
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
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            color: 'black'
          }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
              {battleResult === 'win' ? 'VICTORY!' : 'DEFEAT...'}
            </h1>
            <button
              onClick={onClose}
              style={{
                padding: '15px 30px',
                fontSize: '24px',
                backgroundColor: battleResult === 'win' ? '#4CAF50' : '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
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
