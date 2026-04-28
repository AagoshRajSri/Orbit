export const THEME_STORAGE_KEY = "chat-theme";

export const applyTheme = (themeId) => {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", themeId);
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
};

export const initTheme = ({
  allowedThemes = [],
  defaultTheme = "light",
} = {}) => {
  if (typeof window === "undefined") return defaultTheme;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme && (!allowedThemes.length || allowedThemes.includes(savedTheme))) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    return savedTheme;
  }

  document.documentElement.setAttribute("data-theme", defaultTheme);
  return defaultTheme;
};

