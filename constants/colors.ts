/**
 * Warm paper palette — 6 meaningful colors total.
 * No dark mode for v1.
 */

export const C = {
  /** Warm paper / very pale cream — screen background */
  bg: '#F5F0E8',

  /** Near-black dark brown — primary text & borders */
  ink: '#2C1810',

  /** Warm chocolate brown — poop character body */
  poop: '#7B4B28',

  /** Lighter chocolate — poop character highlight / tile accent */
  poopLight: '#A6673E',

  /** Taupe / dusty beige — secondary text, dividers, disabled */
  muted: '#B8A990',

  /** Very light taupe — tile floor, subtle fills */
  tile: '#E8E0D0',

  /** Muted sage green — accent (action button, confirmation) */
  accent: '#5C7A5E',

  /** Pale parchment — bottom-sheet surface, slightly off bg */
  surface: '#EDE8DC',

  /** White — used sparingly for eyes / glints */
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof C;
