import { memo, useState } from "react";
import ReusableSidebar from "../../ReusableSidebar";

const PastelSidebar = () => {
    const [activeTab, setActiveTab] = useState("nexus");
    return (
        <ReusableSidebar
            activeTab={activeTab === "nexus" ? "orbits" : "contacts"}
            setActiveTab={(t) => setActiveTab(t === "orbits" ? "nexus" : "contacts")}
            className="pastel-sidebar"
        />
    );
};

export default memo(PastelSidebar);
