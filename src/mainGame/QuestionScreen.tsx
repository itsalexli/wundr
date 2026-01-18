import React, { useState, useEffect } from 'react';
import background from '../assets/images/filler-qBackground.jpg';
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
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '20px'
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
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        color: 'white'
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
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '30px',
        borderRadius: '15px',
        textAlign: 'center',
        maxWidth: '700px',
        width: '90%'
      }}>
        <h2 style={{ marginBottom: '10px' }}>🎯 {spellName} Challenge</h2>
        <p style={{ fontSize: '20px', marginBottom: '30px', lineHeight: '1.5' }}>
          {question.question}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginTop: '20px'
        }}>
          {question.options.map((option, index) => {
            let bgColor = '#4a90e2';

            if (showResult) {
              if (index === question.correctIndex) {
                bgColor = '#4CAF50'; // Green for correct
              } else if (index === selectedAnswer) {
                bgColor = '#f44336'; // Red for wrong selection
              } else {
                bgColor = '#666'; // Gray for other options
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                disabled={selectedAnswer !== null}
                style={{
                  padding: '15px 20px',
                  fontSize: '16px',
                  cursor: selectedAnswer !== null ? 'default' : 'pointer',
                  backgroundColor: bgColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease',
                  opacity: showResult && index !== question.correctIndex && index !== selectedAnswer ? 0.5 : 1
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div style={{
            marginTop: '20px',
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
