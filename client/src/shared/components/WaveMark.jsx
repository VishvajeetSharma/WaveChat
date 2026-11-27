/** WaveChat logo mark: a rounded tile with two offset waves. */
export default function WaveMark({ size = 30 }) {
  return (
    <svg
      className="wave-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="10" className="wave-mark-tile" />
      <path
        d="M5 14.5c2.2-3 4.4-3 6.5 0s4.3 3 6.5 0 4.3-3 6.5 0 2.4 2.2 3.5 2.2"
        className="wave-mark-line"
      />
      <path
        d="M5 21c2.2-3 4.4-3 6.5 0s4.3 3 6.5 0 4.3-3 6.5 0 2.4 2.2 3.5 2.2"
        className="wave-mark-line wave-mark-line-soft"
      />
    </svg>
  );
}
