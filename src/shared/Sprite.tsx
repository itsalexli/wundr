import type { FC } from 'react';

interface SpriteProps {
  x: number;
  y: number;
  color?: string;
  size?: number;
  image?: string;
}

export const Sprite: FC<SpriteProps> = ({ x, y, color = 'red', size = 50, image }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: image ? 'transparent' : color,
        backgroundImage: image ? `url(${image})` : undefined,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${x}px, ${y}px)`,
      }}
    />
  );
};
