export function FloatingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Main warm blob */}
      <div
        className="absolute -left-32 top-20 size-[480px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.75 0.18 350 / 0.5), transparent 70%)",
          animation: "drift 18s ease-in-out infinite",
        }}
      />
      {/* Secondary gold blob */}
      <div
        className="absolute -right-32 top-1/3 size-[520px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.15 75 / 0.5), transparent 70%)",
          animation: "drift 22s ease-in-out infinite reverse",
        }}
      />
      {/* Teal accent blob */}
      <div
        className="absolute bottom-20 left-1/3 size-[400px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.14 175 / 0.4), transparent 70%)",
          animation: "drift 25s ease-in-out infinite",
        }}
      />
      {/* NEW: Morphing purple blob */}
      <div
        className="absolute left-1/2 top-[60%] size-[350px] opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.7 0.2 290 / 0.4), transparent 70%)",
          animation: "morph-blob 20s ease-in-out infinite",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      />
      {/* NEW: Small floating accent */}
      <div
        className="absolute right-[15%] top-[20%] size-[200px] opacity-20 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.8 0.15 25 / 0.4), transparent 70%)",
          animation: "morph-blob 15s ease-in-out 5s infinite reverse",
          borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%",
        }}
      />
    </div>
  );
}
