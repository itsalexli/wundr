export const SPRITE_SIZE = 50;

export interface StaticSprite {
  id: string;
  x: number;
  y: number;
  color: string;
  title: string;
  prompt: string;        // The question to ask
  isPortal?: boolean;    // If true, this is a portal (no text input needed)
  image?: string;        // Optional image path for the sprite
  size?: number;         // Optional custom size (defaults to SPRITE_SIZE)
}

import portalGif from '../assets/updated portal.gif';
import stand1 from '../assets/choosingpage/stands/STAND 1.png';
import stand2 from '../assets/choosingpage/stands/STAND 2.png';
import stand3 from '../assets/choosingpage/stands/STAND 3.png';

export const staticSprites: StaticSprite[] = [
  {
    id: 'portal',
    x: 575,
    y: 60,
    color: 'blue',
    title: 'Portal',
    prompt: 'Portal',
    isPortal: true,
    image: portalGif,
    size: 150
  },
  {
    id: 'character',
    x: 270,
    y: 380,
    color: 'green',
    title: 'Character Selection',
    prompt: '',
    image: stand1,
    size: 200
  },
  {
    id: 'music',
    x: 270,
    y: 150,
    color: 'purple',
    title: 'Music Selection',
    prompt: 'What type of background music do you want?',
    image: stand2,
    size: 200
  },
  {
    id: 'background',
    x: 825,
    y: 245,
    color: 'orange',
    title: 'Background Selection',
    prompt: 'What background do you want?',
    image: stand3,
    size: 200
  },
];
