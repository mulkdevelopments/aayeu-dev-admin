import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

// Dark Mode Toggle Button
export default function ThemeToggle({ className = "" }) {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDarkMode(!darkMode)}
      className={`cursor-pointer text-primary dark:text-white ${className}`}
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <MdLightMode className="text-xl" />
      ) : (
        <MdDarkMode className="text-xl" />
      )}
    </Button>
  );
}
