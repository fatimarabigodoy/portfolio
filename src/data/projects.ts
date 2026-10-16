// Every project on the site. The Work page (and later the Home page)
// builds its cards from this list, so a new project only needs adding here.
import type { ImageMetadata } from 'astro';
import elmwood from '../assets/work/elmwood-cover.jpg';
import casino from '../assets/work/casino-cover.jpg';
import coachCedar from '../assets/work/coach-cedar-cover.jpg';
import connection from '../assets/work/connection-cover.jpg';
import headspace from '../assets/work/headspace-cover.jpg';
import planetFitness from '../assets/work/planet-fitness-cover.jpg';
import opl from '../assets/work/opl-cover.jpg';
import pukuPuku from '../assets/work/puku-puku-cover.jpg';

export type Tag = 'Campaign' | 'Brand' | 'Collateral';

export interface Project {
  slug: string;
  title: string;
  tag: Tag;
  /** "client" = Out in the wild, "spec" = Real brands, spec work */
  group: 'client' | 'spec';
  /** One or two sentences. Words wrapped in *stars* show in italics. */
  summary?: string;
  cover?: ImageMetadata;
  /** Which part of the image stays in view when it's cropped, e.g. '60% 40%' */
  focus?: string;
  /** Playful line in the red pill that follows the mouse over the card */
  cta?: string;
  /** Set to true once the project has its own case-study page */
  hasPage?: boolean;
  /** Big line on the Home page's featured cards. Projects with one are featured, in list order. */
  headline?: string;
}

export const projects: Project[] = [
  {
    slug: 'elmwood',
    title: 'Elmwood School',
    tag: 'Campaign',
    group: 'client',
    summary: '*Space to Lead:* Elmwood School’s $10M capital campaign to support a $20M campus expansion.',
    cover: elmwood,
    cta: 'Class is in session',
    headline: 'Women should take up space. Period.',
    hasPage: true,
  },
  {
    slug: 'casino',
    title: 'Casino Mining',
    tag: 'Collateral',
    group: 'client',
    summary: 'A wide range of assets for the Casino Project, a public-facing mining project in the Yukon.',
    cover: casino,
    cta: 'Enter the mines',
    headline: 'Your audience has every right to understand.',
    hasPage: true,
  },
  {
    slug: 'coach-cedar',
    title: 'Coach Cedar',
    tag: 'Brand',
    group: 'client',
    summary: 'Visual identity and messaging system for Coach Cedar, a fitness coaching app that feels like a person, not a product.',
    cover: coachCedar,
    cta: 'Coach what??',
    headline: 'Yeah, it’s tech. But let’s not make it tech-y.',
    hasPage: true,
  },
  {
    slug: 'connection',
    title: 'Big Brothers Big Sisters of Ottawa',
    tag: 'Campaign',
    group: 'client',
    summary: '*Connection:* winner of a 24-hour challenge.',
    cover: connection,
    cta: 'Reconnecting…',
    focus: '50% 30%',
    hasPage: true,
  },

  {
    slug: 'headspace',
    title: 'Headspace',
    tag: 'Campaign',
    group: 'spec',
    summary: '*Mental Tabs:* a campaign for everyone whose brain won’t stop googling.',
    cover: headspace,
    cta: 'One more tab can’t hurt',
    focus: '50% 40%',
    hasPage: true,
  },

  {
    slug: 'planet-fitness',
    title: 'Planet Fitness',
    tag: 'Campaign',
    group: 'spec',
    summary: '*No One Knows:* a gym campaign for people who don’t love gyms.',
    cover: planetFitness,
    cta: 'No one’s watching',
    focus: '50% 35%',
    hasPage: true,
  },

  {
    slug: 'ottawa-public-library',
    title: 'Ottawa Public Library',
    tag: 'Campaign',
    group: 'spec',
    summary: '*Start That Project:* a library campaign for everyone who’s been “definitely starting soon” since 2019.',
    cover: opl,
    cta: 'Borrow the guitar',
    focus: '50% 40%',
    hasPage: true,
  },

  {
    slug: 'puku-puku',
    title: 'Puku Puku',
    tag: 'Campaign',
    group: 'spec',
    summary: '*Meet Your Coffee:* animated web ads that trace one bag of beans 5,000 miles back to the man who grew it.',
    cover: pukuPuku,
    cta: 'Say hi to Vicente',
    focus: '50% 30%',
    hasPage: true,
  },
];

/** The Home page's featured cards: every project with a headline. */
export const featured = projects.filter((p) => p.headline && p.cover);
