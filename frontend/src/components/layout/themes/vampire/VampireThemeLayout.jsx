import { memo, useState } from "react";
import CommonUnifiedLayout from "../../CommonUnifiedLayout";
import VampireNavbar from "./VampireNavbar";
import VampireSidebar from "./VampireSidebar";
import { VampireParticles, BloodRain, Embers, Lightning } from "./VampireEffects";

const VampireThemeLayout = ({ children }) => {
  const [activeTab, setActiveTab] = useState("orbits");

  const BackgroundEffects = memo(() => (
    <>
      <div className="bg-atmosphere" />
      <div className="blood-drip" />
      <VampireParticles />
      <BloodRain />
      <Embers />
      <Lightning />
    </>
  ));

  return (
    <CommonUnifiedLayout
      className="vamp-theme-root"
      Navbar={VampireNavbar}
      Sidebar={<VampireSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      BackgroundEffects={BackgroundEffects}
    >
      {children}
    </CommonUnifiedLayout>
  );
};

export default memo(VampireThemeLayout);
