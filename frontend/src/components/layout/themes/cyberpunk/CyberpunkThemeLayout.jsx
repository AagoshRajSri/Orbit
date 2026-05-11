import { memo, useState } from "react";
import CommonUnifiedLayout from "../../CommonUnifiedLayout";
import CyberpunkNavbar from "./CyberpunkNavbar";
import CyberpunkSidebar from "./CyberpunkSidebar";
import { CyberpunkBackground } from "./CyberpunkEffects";

const CyberpunkThemeLayout = ({ children }) => {
  const [activeTab, setActiveTab] = useState("orbits");

  return (
    <CommonUnifiedLayout
      className="cyberpunk-theme-root"
      Navbar={<CyberpunkNavbar />}
      Sidebar={<CyberpunkSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      BackgroundEffects={CyberpunkBackground}
    >
      {children}
    </CommonUnifiedLayout>
  );
};

export default memo(CyberpunkThemeLayout);
