import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'black' | 'white';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isWhite: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'black',
  setTheme: () => {},
  toggleTheme: () => {},
  isWhite: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('flowpilot_theme');
      return saved === 'white' ? 'white' : 'black';
    } catch {
      return 'black';
    }
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('flowpilot_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'black' ? 'white' : 'black';
    setTheme(nextTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'white') {
      root.classList.add('theme-white');
      root.classList.remove('theme-black');
      root.setAttribute('data-theme', 'white');
      if (body) {
        body.classList.add('theme-white');
        body.classList.remove('theme-black');
        body.style.backgroundColor = '#f8fafc';
        body.style.color = '#0f172a';
      }
    } else {
      root.classList.add('theme-black');
      root.classList.remove('theme-white');
      root.setAttribute('data-theme', 'black');
      if (body) {
        body.classList.add('theme-black');
        body.classList.remove('theme-white');
        body.style.backgroundColor = '#070b13';
        body.style.color = '#f1f5f9';
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isWhite: theme === 'white',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
