import type { CSSProperties } from 'react'

interface SpriteProps {
    x: number
    y: number
    color: string
    size: number
}

export function Sprite({ x, y, color, size }: SpriteProps) {
    const style: CSSProperties = {
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '8px',
        transition: 'left 0.05s linear, top 0.05s linear'
    }

    return <div style={style} />
}
