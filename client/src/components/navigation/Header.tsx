import { Link, NavLink } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
];

const Header = () => {
  const { user, logout } = useAuth();

  return (
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50"
      >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Insight Hub
              </p>
            <p className="text-base font-bold text-slate-900 -mt-0.5">Hotel Analytics</p>
            </div>
          </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-red-50 text-red-600" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )
              }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

        {/* User Info */}
        <div className="flex items-center gap-4">
            <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout} 
            className="gap-2 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </motion.header>
  );
};

export default Header;
