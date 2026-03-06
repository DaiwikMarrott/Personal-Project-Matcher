import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  PlusSquare,
  MessageSquare,
  Bell,
  Settings,
  User,
  Search as SearchIcon,
} from "lucide-react";
import HomePage from "./main/HomePage";
import SearchPage from "./main/SearchPage";
import CreateProject from "./main/CreateProject";
import Profile from "./main/Profile";
import Notifications from "./main/Notifications";
import ProjectModal from "./modals/ProjectModal";

export type MainView =
  | "home"
  | "search"
  | "create"
  | "messages"
  | "notifications"
  | "profile"
  | "settings";

export default function MainLayout({
  onLogout,
}: {
  onLogout: () => void;
  key?: string;
}) {
  const [currentView, setCurrentView] = useState<MainView>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: SearchIcon, label: "Discover" },
    { id: "create", icon: PlusSquare, label: "Post Ideas" },
    { id: "messages", icon: MessageSquare, label: "Messages" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "profile", icon: User, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentView("search");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-white/80 backdrop-blur-xl border-r-2 border-emerald-100/50 flex flex-col shadow-2xl shadow-emerald-900/5 z-20">
        <div className="p-8">
          <h1 className="text-4xl font-black tracking-tighter text-emerald-500">
            collabb
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as MainView)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-lg ${
                currentView === item.id
                  ? "bg-emerald-100/80 text-emerald-800 shadow-sm"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              }`}
            >
              <item.icon
                className={`w-6 h-6 ${currentView === item.id ? "text-emerald-600" : ""}`}
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button
            onClick={onLogout}
            className="w-full py-4 text-stone-500 hover:text-red-500 font-bold transition-colors text-lg"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#fdfbf7] to-[#e6f7ed]">
        {/* Topbar */}
        <header className="h-24 flex items-center justify-between px-10 bg-white/40 backdrop-blur-md border-b-2 border-emerald-100/50 z-10">
          <form onSubmit={handleSearch} className="relative w-[28rem]">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400" />
            <input
              type="text"
              placeholder="Search project name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-3.5 bg-white/80 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all text-stone-800 font-medium text-lg shadow-sm"
            />
          </form>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView("profile")}
              className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-black border-4 border-white shadow-md text-lg hover:scale-105 transition-transform"
            >
              JD
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-10">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto h-full"
          >
            {currentView === "home" && (
              <HomePage
                onProjectClick={setSelectedProject}
                onFindMatch={() => setCurrentView("search")}
              />
            )}
            {currentView === "search" && (
              <SearchPage
                searchQuery={searchQuery}
                onProjectClick={setSelectedProject}
              />
            )}
            {currentView === "create" && <CreateProject />}
            {currentView === "profile" && <Profile />}
            {currentView === "notifications" && <Notifications />}
            {currentView === "messages" && (
              <div className="flex items-center justify-center h-full text-stone-400 font-bold text-xl">
                Messages coming soon
              </div>
            )}
            {currentView === "settings" && (
              <div className="flex items-center justify-center h-full text-stone-400 font-bold text-xl">
                Settings coming soon
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
