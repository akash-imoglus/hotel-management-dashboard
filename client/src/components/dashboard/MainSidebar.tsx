import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Search,
    Trophy,
    FileSearch,
    Link2,
    Share2,
    Megaphone,
    Infinity,
    BarChart3,
    FileText,
    Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const MainSidebar = () => {
    const location = useLocation();

    const mainNavItems = [
        {
            label: "Search",
            to: "/dashboard",
            icon: Search,
        },
        {
            label: "All Projects",
            to: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            label: "Ranking",
            to: "/dashboard",
            icon: Trophy,
        },
        {
            label: "Audit",
            to: "/dashboard",
            icon: FileSearch,
        },
        {
            label: "Backlink",
            to: "/dashboard",
            icon: Link2,
        },
        {
            label: "Social Media",
            to: "/dashboard",
            icon: Share2,
        },
        {
            label: "Google Ads",
            to: "/dashboard",
            icon: Megaphone,
        },
        {
            label: "Meta Ads",
            to: "/dashboard",
            icon: Infinity,
        },
        {
            label: "Analytics",
            to: "/dashboard",
            icon: BarChart3,
        },
        {
            label: "GSC",
            to: "/dashboard",
            icon: Search,
        },
        {
            label: "Report",
            to: "/dashboard",
            icon: FileText,
        },
    ];

    return (
        <aside className="w-16 flex-shrink-0 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
            {/* Logo/Brand */}
            <div className="h-16 flex items-center justify-center border-b border-slate-200 bg-white">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <Home className="h-5 w-5 text-white" />
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-3 space-y-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {mainNavItems.map((item, index) => {
                    const Icon = item.icon;
                    const isFirstItem = index === 0;
                    const isActive = isFirstItem && (location.pathname === "/dashboard" || location.pathname === "/");

                    return (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            end={false}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-xs font-medium transition-all duration-200 rounded-xl group",
                                isActive
                                    ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                            )}
                            title={item.label}
                        >
                            <Icon className={cn(
                                "h-5 w-5 transition-transform group-hover:scale-110",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                            )} />
                            <span className={cn(
                                "text-[10px] leading-tight text-center font-medium",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                            )}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default MainSidebar;
