import Image from "next/image";

type LogoProps = {
  variant?: "brand" | "inverted";
  size?: number;
  className?: string;
};

/** Orange flamme-SVG til mørk baggrund (inverteret logo). */
function FlameIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M50 8C50 8 38 32 36 48C34 62 28 70 22 78C16 86 14 96 18 104C22 112 32 116 42 114C48 112 50 108 50 108C50 108 52 112 58 114C68 116 78 112 82 104C86 96 84 86 78 78C72 70 66 62 64 48C62 32 50 8 50 8Z"
        fill="currentColor"
      />
      <path
        d="M50 72C50 72 44 80 42 88C40 96 44 104 50 108C56 104 60 96 58 88C56 80 50 72 50 72Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M58 20C58 20 66 36 68 50C70 60 76 66 80 72C76 58 70 40 58 20Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M42 20C42 20 34 36 32 50C30 60 24 66 20 72C24 58 30 40 42 20Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

export function Logo({ variant = "brand", size = 80, className = "" }: LogoProps) {
  if (variant === "inverted") {
    return (
      <div className={`inline-flex text-[var(--accent)] ${className}`}>
        <FlameIcon size={size} />
      </div>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="SKS logo"
      width={size}
      height={size}
      className={`rounded-2xl ${className}`}
      priority
    />
  );
}
