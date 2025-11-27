import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/navigation/Header";

const AppLayout = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-hotel-foam">
    <div className="absolute inset-0 -z-10 bg-hero-texture" aria-hidden />
    <div className="flex min-h-screen flex-col">
      <Header />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="container flex-1 py-8"
      >
        <Outlet />
      </motion.main>
    </div>
  </div>
);

export default AppLayout;

