import { memo } from "react";
import CommonUnifiedLayout from "../../CommonUnifiedLayout";
import LightNavbar from "./LightNavbar";
import LightSidebar from "./LightSidebar";

const LightThemeLayout = ({ children }) => {
  return (
    <CommonUnifiedLayout
      className="light-theme-root"
      Navbar={LightNavbar}
      Sidebar={<LightSidebar />}
    >
      {children}
    </CommonUnifiedLayout>
  );
};

export default memo(LightThemeLayout);
