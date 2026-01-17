import type { FC } from 'react';

interface SpriteProps {
  x: number;
  y: number;
  color: string;
  size?: number;
}

export const Sprite: FC<SpriteProps> = ({ x, y, color, size = 50 }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${x}px, ${y}px)`,
      }}
    />
  );
};
