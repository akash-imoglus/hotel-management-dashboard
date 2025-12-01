import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/navigation/Header";
import MainSidebar from "@/components/dashboard/MainSidebar";
import ProjectSelector from "@/components/dashboard/ProjectSelector";

const DashboardLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-20">
        <Header />
      </div>

      {/* Content Container */}
      <div className="flex flex-1 pt-20 overflow-hidden">
        {/* Permanent Main Sidebar */}
        <MainSidebar />

        {/* Project Selector with Project Details and Insights */}
        <ProjectSelector />

        {/* Main Content Area */}
        <motion.main
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 overflow-auto bg-slate-50"
        >
          <div className="p-6">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;


