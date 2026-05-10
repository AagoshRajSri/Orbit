import { memo } from "react";

export const GamerBackground = memo(() => (
    <div className="gamer-background-root">
       <div className="gamer-nebula-wash" />
       <div className="gamer-stars-overlay" />
       <div className="gamer-scanlines" />
       <div className="gamer-debris-layer">
          {/* Debris rendered via CSS in theme-base.css or similar if possible,
              but for now we'll rely on the theme component to provide the specific shards logic if needed
              or just a simplified version here. */}
       </div>
    </div>
));
