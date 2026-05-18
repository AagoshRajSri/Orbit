import OrbitLanding from "../layout/OrbitLanding";
import OrbitLoader from "../common/OrbitLoader";

const isMobile = () => window.innerWidth <= 768;

export default function PostAuthLoader({ onComplete }) {
  const mobile = isMobile();

  return (
    <div
      style={{ zIndex: 999999 }}
      className="fixed inset-0 pointer-events-auto bg-[#00010a]"
    >
      {mobile ? (
        <OrbitLoader onComplete={onComplete} timeScale={1.5} />
      ) : (
        <OrbitLanding onComplete={onComplete} />
      )}
    </div>
  );
}
