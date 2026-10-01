/**
 * Typography scale.
 *
 * Two font families:
 *   PIXEL  — "Press Start 2P" for headings, numbers, buttons, labels
 *   BODY   — System sans-serif for editable inputs, long sentences
 *
 * The PIXEL font has a built-in 8px line-height baseline;
 * every size here is a multiple of 8.
 */

export const FONT = {
  pixel: 'PressStart2P',
  body: 'System',
} as const;

export const SIZE = {
  /** Tiny label / status tag */
  xxs: 7,
  /** Secondary label */
  xs: 9,
  /** Button / nav text */
  sm: 10,
  /** Body / normal */
  md: 12,
  /** Sub-heading */
  lg: 14,
  /** Heading */
  xl: 18,
  /** Large elapsed-time number */
  hero: 28,
  /** Extra-large hero number */
  heroXl: 36,
} as const;

export const LINE_HEIGHT = {
  xxs: 14,
  xs: 18,
  sm: 20,
  md: 22,
  lg: 26,
  xl: 32,
  hero: 44,
  heroXl: 52,
} as const;
