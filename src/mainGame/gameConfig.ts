export const SPRITE_SIZE = 50;

export interface StaticSprite {
  id: string;
  x: number;
  y: number;
  color: string;
  title: string;
}

export const staticSprites: StaticSprite[] = [
  { id: '1', x: 150, y: 100, color: 'blue', title: 'Blue Room' },
  { id: '2', x: 400, y: 100, color: 'green', title: 'Green Forest' },
  { id: '3', x: 650, y: 100, color: 'purple', title: 'Purple Cave' },
  { id: '4', x: 150, y: 250, color: 'orange', title: 'Orange Sunset' },
  { id: '5', x: 400, y: 250, color: 'red', title: 'Red Mountain' },
  { id: '6', x: 650, y: 250, color: 'yellow', title: 'Yellow Desert' },
  { id: '7', x: 150, y: 400, color: 'cyan', title: 'Cyan Lake' },
  { id: '8', x: 400, y: 400, color: 'pink', title: 'Pink Valley' },
];
