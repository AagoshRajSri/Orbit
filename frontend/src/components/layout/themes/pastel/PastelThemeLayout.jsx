import { memo } from "react";
import CommonUnifiedLayout from "../../CommonUnifiedLayout";
import PastelNavbar from "./PastelNavbar";
import PastelSidebar from "./PastelSidebar";
import { PastelBackground } from "./PastelEffects";

const PastelThemeLayout = ({ children }) => {
  return (
    <CommonUnifiedLayout
      className="pastel-theme-root"
      Navbar={PastelNavbar}
      Sidebar={<PastelSidebar />}
      BackgroundEffects={PastelBackground}
    >
      {children}
    </CommonUnifiedLayout>
  );
};

export default memo(PastelThemeLayout);
