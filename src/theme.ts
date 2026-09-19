// src/theme.ts
import { createTheme } from '@mui/material/styles';

// Export a luxury MUI theme that mirrors the Titanium Onyx & Champagne Luxe design language.
export const getTheme = (isDarkMode: boolean) =>
  createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#c59d5f',
        light: '#e5b95c',
        dark: '#aa7f43',
        contrastText: '#0a0d14',
      },
      secondary: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      background: {
        default: isDarkMode ? '#0a0d14' : '#fbfbfe',
        paper: isDarkMode ? '#111622' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#f8fafc' : '#0f172a',
        secondary: isDarkMode ? '#94a3b8' : '#64748b',
      },
    },
    typography: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '9999px',
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
    },
  });
