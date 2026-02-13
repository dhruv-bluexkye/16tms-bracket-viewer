import { useEffect } from 'react';
import themeConfig from '../data/theme.json';
import type { ApiThemeResponse } from '../services/api';

// Create a type that matches the structure of ApiThemeResponse['data']['theme']
// but is compatible with the local theme.json structure.
type ThemeConfig = typeof themeConfig | ApiThemeResponse['data']['theme'];

export const applyTheme = (theme: ThemeConfig) => {
    const root = document.documentElement;

    // Helper to safely access nested properties, falling back to defaults if needed?
    // For now assuming the structure matches.

    // Apply colors
    root.style.setProperty('--bg-color', theme.colors.background);
    root.style.setProperty('--card-bg-start', theme.colors.card.backgroundStart);
    root.style.setProperty('--card-bg-end', theme.colors.card.backgroundEnd);

    // Check if hover exists, otherwise derive or skip?
    if ('hover' in theme.colors.card && theme.colors.card.hover) {
        root.style.setProperty('--card-hover', theme.colors.card.hover);
    }

    if ('shadow' in theme.colors.card && theme.colors.card.shadow) {
        root.style.setProperty('--card-shadow', theme.colors.card.shadow);
    } else {
        root.style.setProperty('--card-shadow', '0 4px 10px rgba(0, 0, 0, 0.2)');
    }

    // Apply text colors
    root.style.setProperty('--text-primary', theme.colors.text.primary);
    root.style.setProperty('--text-secondary', theme.colors.text.secondary);

    // Apply accent and functional colors
    root.style.setProperty('--accent-color', theme.colors.accent);
    root.style.setProperty('--line-color', theme.colors.line);
    root.style.setProperty('--border-color', theme.colors.border);

    root.style.setProperty('--header-bg', theme.colors.headerBackground);
    root.style.setProperty('--winner-bg', theme.colors.winnerBackground);

    // Apply layout
    root.style.setProperty('--match-width', theme.layout.matchWidth);
    root.style.setProperty('--round-gap', theme.layout.roundGap);
};

export const ThemeController = () => {
    useEffect(() => {
        applyTheme(themeConfig);
    }, []);

    return null;
};
