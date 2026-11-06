interface LogoProps {
  /** On dark backgrounds the wordmark turns white. */
  tone?: 'dark' | 'light';
  className?: string;
}

/** The mark is a piece fitting into a slot: what the product does with a booking. */
export function Logo({ tone = 'dark', className = '' }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Encaixe"
      className={`inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight ${
        tone === 'light' ? 'text-white' : 'text-eucalyptus-800'
      } ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
        <path
          d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3v-7H9v7H6a3 3 0 0 1-3-3z"
          fill="#E3A72F"
        />
        <rect
          x="9.5"
          y="11"
          width="5"
          height="10"
          rx="1.5"
          fill={tone === 'light' ? '#FFFFFF' : '#1F5C55'}
        />
      </svg>
      encaixe
    </span>
  );
}
