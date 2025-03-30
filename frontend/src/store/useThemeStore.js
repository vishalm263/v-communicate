import { create } from "zustand";

// Helper function to get the preferred theme
const getPreferredTheme = () => {
  // Check if user has a stored preference
  const storedTheme = localStorage.getItem("chat-theme");
  
  // If there's a stored theme, use it
  if (storedTheme) return storedTheme;
  
  // Otherwise, check if user prefers dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return "system";
  }
  
  // Default to light theme
  return "light";
};

export const useThemeStore = create((set) => ({
  theme: getPreferredTheme(),
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
