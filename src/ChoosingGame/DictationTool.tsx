import { useState, useRef, useEffect } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

// ============================================
// DictationButton - Modular, embeddable mic button
// ============================================
export interface DictationButtonProps {
    /** Called whenever the transcript changes (final + interim text) */
    onTranscriptChange?: (transcript: string) => void;
    /** Called with only the finalized transcript */
    onFinalTranscript?: (transcript: string) => void;
    /** Speech recognition language (default: 'en-US') */
    language?: string;
    /** Custom styles for the button */
    style?: React.CSSProperties;
    /** Custom class name */
    className?: string;
    /** Button size in pixels (default: 48) */
    size?: number;
}

export function DictationButton({
    onTranscriptChange,
    onFinalTranscript,
    language = 'en-US',
    style,
    className,
    size = 48,
}: DictationButtonProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef('');

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognitionAPI) {
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalText = '';
                let interimText = '';

                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalText += result[0].transcript;
                    } else {
                        interimText += result[0].transcript;
                    }
                }

                finalTranscriptRef.current = finalText;

                // Notify parent of full transcript (final + interim)
                onTranscriptChange?.(finalText + interimText);

                // Notify parent of finalized text only
                if (finalText) {
                    onFinalTranscript?.(finalText);
                }
            };

            recognition.onerror = () => {
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [language, onTranscriptChange, onFinalTranscript]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            finalTranscriptRef.current = '';
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const buttonStyle: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: isListening ? '#e53935' : '#4caf50',
        color: 'white',
        fontSize: size * 0.4,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        animation: isListening ? 'dictation-pulse 1.5s infinite' : 'none',
        ...style,
    };

    return (
        <>
            <style>
                {`
                    @keyframes dictation-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.4); }
                        70% { box-shadow: 0 0 0 15px rgba(229, 57, 53, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
                    }
                `}
            </style>
            <button
                style={buttonStyle}
                className={className}
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : 'Start listening'}
                type="button"
            >
                {isListening ? '⏹' : '🎙️'}
            </button>
        </>
    );
}

// ============================================
// DictationTool - Original standalone component (backwards compatible)
// ============================================
function DictationTool() {
    const [isOpen, setIsOpen] = useState(false);
    const [transcript, setTranscript] = useState('');

    const styles = {
        toggleButton: {
            position: 'absolute' as const,
            top: '16px',
            right: '16px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#4a90d9',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        panel: {
            position: 'absolute' as const,
            top: '72px',
            right: '16px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        textArea: {
            width: '280px',
            height: '80px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            resize: 'none' as const,
            fontFamily: 'inherit',
        },
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                style={styles.toggleButton}
                onClick={() => setIsOpen(!isOpen)}
                title="Dictation Tool"
            >
                {isOpen ? '✕' : '🎤'}
            </button>

            {/* Dictation Panel */}
            {isOpen && (
                <div style={styles.panel}>
                    <textarea
                        style={styles.textArea}
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Click the mic and start speaking..."
                    />
                    <DictationButton
                        onTranscriptChange={setTranscript}
                    />
                </div>
            )}
        </>
    );
}

export default DictationTool;
