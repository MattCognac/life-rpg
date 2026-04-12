"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[hsl(180,20%,5%)] text-[hsl(40,30%,80%)] font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6 border border-[hsl(180,10%,18%)] p-8 bg-[hsl(180,15%,9%)]">
            <h2 className="text-2xl tracking-widest uppercase">
              The Realm Has Fallen
            </h2>
            <p className="text-sm opacity-60">
              A critical error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm uppercase tracking-widest text-white transition-all duration-300"
              style={{
                background: "linear-gradient(180deg, hsl(20,78%,48%), hsl(10,75%,38%))",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
