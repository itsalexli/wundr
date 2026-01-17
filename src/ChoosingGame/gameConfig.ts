export const SPRITE_SIZE = 50;

export interface StaticSprite {
  id: string;
  x: number;
  y: number;
  color: string;
  title: string;
}

export const staticSprites: StaticSprite[] = [
  { id: '1', x: 200, y: 150, color: 'blue', title: 'Blue Room' },
  { id: '2', x: 400, y: 150, color: 'green', title: 'Green Forest' },
  { id: '3', x: 200, y: 350, color: 'purple', title: 'Purple Cave' },
  { id: '4', x: 400, y: 350, color: 'orange', title: 'Orange Sunset' },
];
