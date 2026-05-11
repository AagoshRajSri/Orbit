import { memo, useState } from "react";
import CommonUnifiedLayout from "../../CommonUnifiedLayout";
import AmoledNavbar from "./AmoledNavbar";
import AmoledSidebar from "./AmoledSidebar";
import { AmoledBackground } from "./AmoledEffects";

const AmoledThemeLayout = ({ children }) => {
  const [activeTab, setActiveTab] = useState("orbits");

  return (
    <CommonUnifiedLayout
      className="amoled-theme-root"
      Navbar={<AmoledNavbar />}
      Sidebar={<AmoledSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      BackgroundEffects={AmoledBackground}
    >
      {children}
    </CommonUnifiedLayout>
  );
};

export default memo(AmoledThemeLayout);
