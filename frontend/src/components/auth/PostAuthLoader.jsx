import { useEffect } from "react";
import OrbitLanding from "../layout/OrbitLanding";
import OrbitLoader from "../common/OrbitLoader";

const isMobile = () => window.innerWidth <= 768;

export default function PostAuthLoader({ onComplete }) {
  const mobile = isMobile();

  // OrbitLoader has no onComplete prop — auto-dismiss after its animation cycle (~6s)
  useEffect(() => {
    if (!mobile) return;
    const t = setTimeout(() => onComplete?.(), 3500);
    return () => clearTimeout(t);
  }, [mobile, onComplete]);

  return (
    <div
      style={{ zIndex: 999999 }}
      className="fixed inset-0 pointer-events-auto bg-[#00010a]"
    >
      {mobile ? (
        <OrbitLoader />
      ) : (
        <OrbitLanding onComplete={onComplete} />
      )}
    </div>
  );
}
