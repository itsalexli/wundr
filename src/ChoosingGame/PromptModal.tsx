import { useState } from 'react';
import { DictationButton } from './DictationTool';

export interface PromptModalProps {
    /** The prompt/question to display */
    prompt: string;
    /** Called when user submits their answer */
    onSubmit: (answer: string) => void;
    /** Called when user closes/cancels the modal */
    onClose: () => void;
    /** Optional placeholder text for the input */
    placeholder?: string;
}

export function PromptModal({
    prompt,
    onSubmit,
    onClose,
    placeholder = 'Type your answer or use the mic...',
}: PromptModalProps) {
    const [answer, setAnswer] = useState('');

    const handleSubmit = () => {
        onSubmit(answer);
        setAnswer('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
        }
    };

    const styles: Record<string, React.CSSProperties> = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
        },
        modal: {
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            position: 'relative',
        },
        closeButton: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f0f0f0',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        promptText: {
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#333',
            paddingRight: '32px',
        },
        inputContainer: {
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
        },
        textarea: {
            flex: 1,
            minHeight: '100px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px',
            fontFamily: 'inherit',
            resize: 'vertical' as const,
        },
        buttonContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        submitButton: {
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#4a90d9',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '16px',
            width: '100%',
        },
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button style={styles.closeButton} onClick={onClose} title="Close">
                    ✕
                </button>

                {/* Prompt Text */}
                <div style={styles.promptText}>{prompt}</div>

                {/* Input Area */}
                <div style={styles.inputContainer}>
                    <textarea
                        style={styles.textarea}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoFocus
                    />
                    <div style={styles.buttonContainer}>
                        <DictationButton
                            onTranscriptChange={(text) => setAnswer((prev) => prev + text)}
                            size={48}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button style={styles.submitButton} onClick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>
    );
}

export default PromptModal;
