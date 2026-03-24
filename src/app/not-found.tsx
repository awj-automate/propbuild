import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="text-7xl font-bold text-[var(--green-primary)] mb-2">
          404
        </h1>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          Page not found
        </h2>
        <p className="text-[var(--muted)] mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--green-primary)] hover:bg-[var(--green-dark)] text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--green-primary)]/20 focus:ring-offset-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
}
