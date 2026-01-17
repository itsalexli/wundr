export const SPRITE_SIZE = 50;

export interface StaticSprite {
  id: string;
  x: number;
  y: number;
  color: string;
  title: string;
  prompt: string;        // The question to ask
  isPortal?: boolean;    // If true, this is a portal (no text input needed)
}

export const staticSprites: StaticSprite[] = [
  {
    id: 'portal',
    x: 200,
    y: 150,
    color: 'blue',
    title: 'Portal',
    prompt: 'Portal',
    isPortal: true
  },
  {
    id: 'character',
    x: 400,
    y: 150,
    color: 'green',
    title: 'Character Selection',
    prompt: 'What type of character do you want to play as?'
  },
  {
    id: 'music',
    x: 200,
    y: 350,
    color: 'purple',
    title: 'Music Selection',
    prompt: 'What type of background music do you want?'
  },
  {
    id: 'background',
    x: 400,
    y: 350,
    color: 'orange',
    title: 'Background Selection',
    prompt: 'What background do you want?'
  },
];
