import { memo, useState } from "react";
import ReusableSidebar from "../../ReusableSidebar";

const LightSidebar = () => {
    const [activeTab, setActiveTab] = useState("nexus");
    return (
        <ReusableSidebar
            activeTab={activeTab === "nexus" ? "orbits" : "contacts"}
            setActiveTab={(t) => setActiveTab(t === "orbits" ? "nexus" : "contacts")}
            className="light-sidebar"
        />
    );
};

export default memo(LightSidebar);
