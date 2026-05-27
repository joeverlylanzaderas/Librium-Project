// shared/constants/theme.ts
// ─────────────────────────────────────────────
//  LIBRIUM — Single source of truth for all design tokens
//  Import this in both web (via @shared) and mobile (via @shared)
// ─────────────────────────────────────────────

// ── Sidebar palette ──────────────────────────
export const SIDEBAR = {
  espresso:      '#1F150C',   // sidebar background
  mahogany:      '#412D15',   // active item background
  parchment:     '#FBF5DD',   // sidebar text
  parchmentDark: '#EFE9CE',   // sidebar text muted / hover
  brass:         '#FFC85C',   // active item text, logo accent
  amber:         '#F69D39',   // CTA buttons, highlights
  textMain:      '#2D1F10',   // dark text on light surfaces
  textMuted:     '#706251',   // muted nav items
} as const;

// ── Content area — light mode ─────────────────
export const LIGHT = {
  background:         '#FBF5DD',   // main page background (parchment)
  backgroundElement:  '#F0F0F3',   // cards, inputs
  backgroundSelected: '#E0E1E6',   // hover / selected state
  backgroundCard:     '#EFE9CE',   // card surfaces
  text:               '#2D1F10',   // primary text
  textSecondary:      '#60646C',   // secondary / metadata text
  border:             '#D9D3BC',   // input borders, dividers
} as const;

// ── Content area — dark mode ──────────────────
export const DARK = {
  background:         '#000000',
  backgroundElement:  '#212225',
  backgroundSelected: '#2E3135',
  backgroundCard:     '#1A1A1C',
  text:               '#FFFFFF',
  textSecondary:      '#B0B4BA',
  border:             '#2E3135',
} as const;

// ── Topbar ────────────────────────────────────
export const TOPBAR = {
  background: '#1F150C',   // same as sidebar — unified dark header
  text:       '#FBF5DD',
  border:     '#412D15',
} as const;

// ── Semantic colors ───────────────────────────
export const STATUS = {
  success:        '#3B6D11',
  successBg:      '#EAF3DE',
  warning:        '#BA7517',
  warningBg:      '#FAEEDA',
  danger:         '#A32D2D',
  dangerBg:       '#FCEBEB',
  info:           '#185FA5',
  infoBg:         '#E6F1FB',
  overdue:        '#E24B4A',
  overdueBg:      '#FCEBEB',
} as const;

// ── Loan / status badge colors ────────────────
export const BADGE = {
  active:     { bg: '#EAF3DE', text: '#3B6D11' },
  overdue:    { bg: '#FCEBEB', text: '#A32D2D' },
  pending:    { bg: '#FAEEDA', text: '#854F0B' },
  returned:   { bg: '#F0F0F3', text: '#60646C' },
  reserved:   { bg: '#E6F1FB', text: '#185FA5' },
  cancelled:  { bg: '#F0F0F3', text: '#60646C' },
  paid:       { bg: '#EAF3DE', text: '#3B6D11' },
  unpaid:     { bg: '#FCEBEB', text: '#A32D2D' },
  admin:      { bg: '#2E3135', text: '#FFC85C' },
  librarian:  { bg: '#412D15', text: '#FFC85C' },
  student:    { bg: '#FAEEDA', text: '#854F0B' },
  faculty:    { bg: '#E6F1FB', text: '#185FA5' },
} as const;

// ── Typography ────────────────────────────────
export const FONTS = {
  display:     'Gloock-Regular',           // hero titles, LIBRIUM wordmark
  serif:       'Literata-Regular',         // body text, paragraphs
  serifMedium: 'Literata-Medium',          // UI labels, nav items
  serifSemi:   'Literata-SemiBold',        // section headings
  baskerville: 'LibreBaskerville-Regular', // form labels, secondary serif
  baskervilleBold: 'LibreBaskerville-Bold',
} as const;

// ── Font sizes ────────────────────────────────
export const FONT_SIZE = {
  xs:   12,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
} as const;

// ── Spacing ───────────────────────────────────
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  '2xl': 32,
  '3xl': 48,
} as const;

// ── Border radius ─────────────────────────────
export const RADIUS = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
} as const;

// ── Sidebar dimensions ────────────────────────
export const SIDEBAR_WIDTH        = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 0;
export const TOPBAR_HEIGHT        = 56;
