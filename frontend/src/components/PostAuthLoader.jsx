import OrbitLanding from "./OrbitLanding";

export default function PostAuthLoader({ onComplete }) {
  // OrbitLanding handles its own visual lifecycle, fading, and completion trigger.
  // We simply wrapper it in a high z-index fixed container.
  return (
    <div
      style={{ zIndex: 999999 }}
      className="fixed inset-0 pointer-events-auto bg-[#00010a]"
    >
      <OrbitLanding onComplete={onComplete} />
    </div>
  );
}
