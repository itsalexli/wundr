import React, { useState, useEffect } from 'react';
import background from '../assets/questionModal/questionBackground.png';
import blankButton from '../assets/questionModal/blankButton.png';
import { generateQuestion, type Question } from './questionGenerator';
import type { AgeLevel } from './questionBank';

interface QuestionScreenProps {
  spellName: string;
  learningMaterial?: string;
  ageLevel?: AgeLevel;
  preloadedQuestion?: Question | null;
  onClose: (correct?: boolean) => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  spellName,
  learningMaterial,
  ageLevel = '6-7',
  preloadedQuestion,
  onClose
}) => {
  const [question, setQuestion] = useState<Question | null>(preloadedQuestion || null);
  const [isLoading, setIsLoading] = useState(!preloadedQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Generate question on mount ONLY if no preloaded question
  useEffect(() => {
    if (preloadedQuestion) {
      setQuestion(preloadedQuestion);
      setIsLoading(false);
      return;
    }

    // Fallback: generate a question if none was preloaded
    setIsLoading(true);
    generateQuestion(learningMaterial || '', ageLevel)
      .then(q => {
        setQuestion(q);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [learningMaterial, ageLevel, preloadedQuestion]);

  const handleAnswerClick = (index: number) => {
    if (selectedAnswer !== null) return; // Already answered

    setSelectedAnswer(index);
    setShowResult(true);

    const isCorrect = question !== null && index === question.correctIndex;

    // Wait a moment to show result, then close
    setTimeout(() => {
      onClose(isCorrect);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '30px'
      }}>
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <h2>🎯 Generating Question for {spellName}...</h2>
          <div style={{ fontSize: '48px', marginTop: '20px' }}>⏳</div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        backgroundColor: '#333',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '30px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Failed to load question</h2>
          <button onClick={() => onClose(false)} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '600px',
      height: '600px',
      backgroundImage: `url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: '15px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      color: 'white'
    }}>
      <div style={{
        padding: '30px',
        borderRadius: '15px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2 style={{ marginBottom: '10px', marginTop: '40px' }}>{spellName} Challenge</h2>
        <p style={{ fontSize: '20px', marginBottom: '80px', lineHeight: '1.5' }}>
          {question.question}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginTop: '20px'
        }}>
          {question.options.map((option, index) => {
            let buttonStyle: React.CSSProperties = {
              width: '180px',
              height: '60px',
              backgroundImage: `url(${blankButton})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '10px',
              cursor: selectedAnswer !== null ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center' as const,
              padding: '8px',
              transition: 'all 0.3s ease',
              color: 'black',
              position: 'relative'
            };

            // Apply color overlay for results
            if (showResult) {
              let overlayColor = 'transparent';
              if (index === question.correctIndex) {
                overlayColor = 'rgba(76, 175, 80, 0.8)'; // Green overlay for correct
              } else if (index === selectedAnswer) {
                overlayColor = 'rgba(244, 67, 54, 0.8)'; // Red overlay for wrong selection
              } else {
                overlayColor = 'rgba(128, 128, 128, 0.6)'; // Gray overlay for other options
              }

              buttonStyle = {
                ...buttonStyle,
                backgroundColor: overlayColor,
                backgroundBlendMode: 'overlay'
              };
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                disabled={selectedAnswer !== null}
                style={buttonStyle}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div style={{
            marginTop: '20px',
            marginBottom: '-60px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: selectedAnswer === question.correctIndex ? '#4CAF50' : '#f44336'
          }}>
            {selectedAnswer === question.correctIndex ? '✓ Correct!' : '✗ Wrong!'}
          </div>
        )}
      </div>
    </div>
  );
};
