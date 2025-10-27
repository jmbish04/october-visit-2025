import { NavLink } from "react-router-dom";
import { Map, Menu, NotebookPen, BotMessageSquare } from "lucide-react";

const tabs = [
  { to: "/", label: "Menu", icon: Menu },
  { to: "/?map=true", label: "Map", icon: Map },
  { to: "/itinerary", label: "Itinerary", icon: NotebookPen },
  { to: "/itinerary#chat", label: "Chat", icon: BotMessageSquare }
];

const NavigationBar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur shadow-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-around px-4 py-3">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                isActive ? "text-muted-green" : "text-steel-gray"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default NavigationBar;
