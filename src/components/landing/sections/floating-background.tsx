export function FloatingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -left-32 top-20 size-[480px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.18 25 / 0.6), transparent 70%)",
          animation: "drift 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-32 top-1/3 size-[520px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.8 0.18 200 / 0.6), transparent 70%)",
          animation: "drift 22s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-20 left-1/3 size-[400px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.18 95 / 0.5), transparent 70%)",
          animation: "drift 25s ease-in-out infinite",
        }}
      />
    </div>
  );
}
