// Fixed pairs keep every combination at AA contrast.
const PALETTE = [
  'bg-eucalyptus-100 text-eucalyptus-800',
  'bg-saffron-100 text-saffron-700',
  'bg-ruby-50 text-ruby-700',
  'bg-eucalyptus-200 text-eucalyptus-900',
] as const;

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
} as const;

/** First and last name initials, e.g. "Ana Maria Souza" → "AS". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

// The same person always gets the same color, on every screen and visit.
function colorOf(name: string): string {
  let sum = 0;
  for (const char of name) {
    sum += char.charCodeAt(0);
  }
  return PALETTE[sum % PALETTE.length] ?? PALETTE[0];
}

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
}

/** Decorative: the name is always shown next to it, so screen readers skip it. */
export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${SIZES[size]} ${colorOf(name)}`}
    >
      {initialsOf(name)}
    </span>
  );
}
