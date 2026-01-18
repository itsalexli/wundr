import { useState } from 'react';
import { DictationButton } from './DictationTool';
import submitButtonImg from '../assets/images/buttons/submitButton.png';

export interface PromptModalProps {
    /** The prompt/question to display */
    prompt: string;
    /** Called when user submits their answer */
    onSubmit: (answer: string) => void;
    /** Called when user closes/cancels the modal */
    onClose: () => void;
    /** Optional placeholder text for the input */
    placeholder?: string;
    /** Optional custom width for the modal */
    width?: string;
    /** Optional custom height for the modal */
    height?: string;
    /** Optional layout variant */
    layout?: 'default' | 'split';
    /** Optional callback when input changes */
    onInputChange?: (value: string) => void;
    /** Optional content to render in the left pane (split layout only) */
    leftPaneContent?: React.ReactNode;
    /** Optional content to render in the right pane */
    rightPaneContent?: React.ReactNode;
    /** Whether to show loading state */
    isLoading?: boolean;
    /** Whether to clear input on submit (default true) */
    clearOnSubmit?: boolean;
    /** Optional background image URL */
    backgroundImage?: string;
    /** Optional custom style for the input area container */
    inputAreaStyle?: React.CSSProperties;
    /** Optional custom style for the textarea itself */
    /** Optional custom style for the textarea itself */
    textareaStyle?: React.CSSProperties;
    /** Optional to hide the input area (e.g. for review mode) */
    hideInput?: boolean;
    /** Optional image for the close button */
    closeButtonImage?: string;
    /** Optional custom style for the close button */
    closeButtonStyle?: React.CSSProperties;
}

export function PromptModal({
    prompt,
    onSubmit,
    onClose,
    placeholder = 'Type your answer or use the mic...',
    width,
    height,
    layout = 'default',
    onInputChange,
    leftPaneContent,
    rightPaneContent,
    isLoading = false,
    clearOnSubmit = true,
    backgroundImage,
    inputAreaStyle,
    textareaStyle,
    closeButtonImage,
    closeButtonStyle,
    hideInput = false,
}: PromptModalProps) {
    const [answer, setAnswer] = useState('');
    const [answerBeforeDictation, setAnswerBeforeDictation] = useState('');

    const handleSubmit = () => {
        if (isLoading) return;
        onSubmit(answer);
        if (clearOnSubmit) {
            setAnswer('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setAnswer(newValue);
        onInputChange?.(newValue);
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
            backgroundColor: backgroundImage ? 'transparent' : 'white',
            borderRadius: '16px',
            padding: layout === 'split' ? '0' : '24px',
            maxWidth: width ? '90%' : '500px',
            width: width || '90%',
            height: height || 'auto',
            maxHeight: height ? '90vh' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: backgroundImage ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        closeButton: closeButtonImage ? {
            position: 'absolute',
            top: '40px',
            right: '70px',
            width: '60px',
            height: 'auto',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            zIndex: 10,
            ...closeButtonStyle, // Apply custom styles
        } : {
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
            zIndex: 10,
            ...closeButtonStyle, // Apply custom styles
        },
        // Split Layout Styles
        splitContainer: {
            display: 'flex',
            flexDirection: 'row',
            height: '100%',
            width: '100%',
        },
        leftPane: {
            width: '45%',
            backgroundColor: 'transparent',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        rightPane: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end', // Align content to bottom
            padding: '24px',
            height: '100%',
            boxSizing: 'border-box',
            position: 'relative', // Allow absolute positioning of children if needed
        },
        // Content Styles
        promptText: {
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#333',
            paddingRight: '32px',
        },
        inputWrapper: {
            // No margin needed as parent aligns to bottom
            ...inputAreaStyle, // Apply custom styles
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
            ...textareaStyle, // Apply custom styles
        },
        submitButton: {
            border: 'none',
            background: 'none',
            cursor: isLoading ? 'wait' : 'pointer',
            marginTop: '16px',
            width: '100%',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        submitRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            marginTop: '-13px'
        },
        dictationContainer: {
            display: 'flex',
            alignItems: 'center'
        },
    };

    const renderContent = () => (
        <>
            <style>
                {`
                    .prompt-modal-textarea:focus {
                        outline: 2px solid #8B4513 !important;
                        outline-offset: 2px;
                    }
                `}
            </style>
            {/* Prompt Text */}
            <div style={styles.promptText}>{prompt}</div>

            {/* Input Wrapper */}
            <div style={styles.inputWrapper}>
                {!hideInput && (
                    <div style={styles.inputContainer}>
                        <textarea
                            className="prompt-modal-textarea"
                            style={styles.textarea}
                            value={answer}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* Submit Button and Dictation Tool Row */}
                <div style={styles.submitRow}>
                    <button style={styles.submitButton} onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? 'Loading...' : (
                        <img
                            src={submitButtonImg}
                            alt="Submit"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                    </button>
                    <div style={styles.dictationContainer}>
                        <DictationButton
                            onDictationStart={() => setAnswerBeforeDictation(answer)}
                            onTranscriptChange={(text) => {
                                const separator = answerBeforeDictation && !answerBeforeDictation.endsWith(' ') ? ' ' : '';
                                const newVal = answerBeforeDictation + separator + text;
                                setAnswer(newVal);
                                onInputChange?.(newVal);
                            }}
                            size={48}
                        />
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                {/* Close Button */}
                <button style={styles.closeButton} onClick={onClose} title="Close">
                    {closeButtonImage ? (
                        <img 
                            src={closeButtonImage} 
                            alt="Close" 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain' 
                            }} 
                        />
                    ) : '✕'}
                </button>

                {layout === 'split' ? (
                    <div style={styles.splitContainer}>
                        <div style={styles.leftPane}>
                            {leftPaneContent}
                        </div>
                        <div style={styles.rightPane}>
                            {rightPaneContent}
                            {renderContent()}
                        </div>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </div>
    );
}

export default PromptModal;
