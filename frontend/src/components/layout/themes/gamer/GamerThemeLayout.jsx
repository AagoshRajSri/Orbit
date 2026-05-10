import { memo, useState } from "react";
import CommonUnifiedLayout from "../../CommonUnifiedLayout";
import GamerNavbar from "./GamerNavbar";
import GamerSidebar from "./GamerSidebar";
import { GamerBackground } from "./GamerEffects";

const GamerThemeLayout = ({ children }) => {
  const [activeTab, setActiveTab] = useState("orbits");

  return (
    <CommonUnifiedLayout
      className="gamer-theme-root"
      Navbar={GamerNavbar}
      Sidebar={<GamerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      BackgroundEffects={GamerBackground}
    >
      {children}
    </CommonUnifiedLayout>
  );
};

export default memo(GamerThemeLayout);
