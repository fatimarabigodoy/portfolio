// Client logos for the moving strip on the Home page, in order.
// The logo files are cream on transparent, in src/assets/logos/.
// `size` nudges a logo bigger (>1) or smaller (<1) if it looks off next to the others.
import type { ImageMetadata } from 'astro';
import purolator from '../assets/logos/purolator.png';
import byward from '../assets/logos/byward.png';
import midwives from '../assets/logos/midwives.png';
import casino from '../assets/logos/casino.png';
import bbbso from '../assets/logos/bbbso.png';
import westernCopper from '../assets/logos/western-copper.png';
import elmwood from '../assets/logos/elmwood.png';
import salus from '../assets/logos/salus.png';

export interface Client {
  name: string;
  logo: ImageMetadata;
  size?: number;
}

export const clients: Client[] = [
  { name: 'Purolator', logo: purolator },
  { name: 'ByWard Market', logo: byward },
  { name: 'Canadian Association of Midwives', logo: midwives },
  { name: 'Casino Mining', logo: casino },
  { name: 'Big Brothers Big Sisters of Ottawa', logo: bbbso },
  { name: 'Western Copper and Gold', logo: westernCopper },
  { name: 'Elmwood School', logo: elmwood },
  { name: 'Solutions by Salus Global', logo: salus },
];
