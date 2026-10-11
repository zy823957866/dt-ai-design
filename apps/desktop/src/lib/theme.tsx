import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

interface ThemeCtx {
  pref: ThemePref;
  theme: Theme;
  setPref: (p: ThemePref) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  pref: 'dark',
  theme: 'dark',
  setPref: () => {},
  toggle: () => {},
});

function resolve(pref: ThemePref): Theme {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  return pref;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(() => {
    try {
      const v = localStorage.getItem('dt-theme') as ThemePref | null;
      return v === 'light' || v === 'dark' || v === 'system' ? v : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(resolve(pref));
    try {
      localStorage.setItem('dt-theme', pref);
    } catch {
      /* ignore */
    }
  }, [pref]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (pref === 'system') setTheme(resolve('system'));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<ThemeCtx>(
    () => ({
      pref,
      theme,
      setPref: setPrefState,
      toggle: () =>
        setPrefState((p) => {
          if (p === 'system')
            return resolve('system') === 'light' ? 'dark' : 'light';
          return p === 'light' ? 'dark' : 'light';
        }),
    }),
    [pref, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
