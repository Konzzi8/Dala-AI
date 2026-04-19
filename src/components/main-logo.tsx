/**
 * Primary wordmark — “DALA” in the app font (regular A glyphs).
 * Use only for main logo placements — elsewhere use the word “Dala”.
 */
export function MainLogo({
  className = "h-8",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const tone = variant === "light" ? "text-[#f8fafc]" : "text-[#0f172a]";

  return (
    <span
      className={`inline-flex items-center font-semibold tracking-tight ${tone} ${className}`}
      role="img"
      aria-label="Dala"
    >
      <span className="sr-only">Dala</span>
      <span aria-hidden className="text-xl leading-none sm:text-2xl">
        DALA<span className="text-[#2563eb]">.</span>
      </span>
    </span>
  );
}
