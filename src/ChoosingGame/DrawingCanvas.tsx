import { useRef, useState, useEffect } from 'react';

interface DrawingCanvasProps {
    onClose: () => void;
    onSubmit: (imageBase64: string) => void;
}

export function DrawingCanvas({ onClose, onSubmit }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Set initial white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                setContext(ctx);
            }
        }
    }, []);

    useEffect(() => {
        if (context) {
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
        }
    }, [context, color, lineWidth]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (context) context.beginPath();
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !context || !canvasRef.current) return;

        e.preventDefault();
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        context.lineTo(x, y);
        context.stroke();
        context.beginPath();
        context.moveTo(x, y);
    };

    const handleClear = () => {
        if (context && canvasRef.current) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleSubmit = () => {
        if (canvasRef.current) {
            const imageBase64 = canvasRef.current.toDataURL('image/png');
            onSubmit(imageBase64);
        }
    };

    const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '90%',
                maxWidth: '600px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Draw Your Character</h2>
                    <button 
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                    >✕</button>
                </div>

                <div style={{ position: 'relative', border: '2px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <canvas
                        ref={canvasRef}
                        width={500}
                        height={500}
                        style={{ width: '100%', height: 'auto', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: c,
                                border: color === c ? '2px solid #333' : '1px solid #ddd',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                    <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: '32px', height: '32px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }} />
                    <button 
                        onClick={handleClear}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Clear
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                        onClick={handleSubmit}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#4a90d9',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Generate Sprites
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DrawingCanvas;
