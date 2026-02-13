import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Section } from './Bracket';
import { useDragScroll } from '../hooks/useDragScroll';
import { upperBracket, lowerBracket } from '../data/mockData';
import '../styles/bracket.scss';
import { fetchTenantTheme } from '../services/api';
import { applyTheme } from './ThemeController';

// Helper hook for theme fetching
const useThemeWithToken = () => {
    const { accessToken } = useParams<{ accessToken: string }>();

    useEffect(() => {
        if (accessToken) {
            console.log('Access token found, fetching theme...', accessToken);
            fetchTenantTheme(accessToken)
                .then(response => {
                    console.log('Theme fetched successfully:', response);
                    if (response.success && response.data?.theme) {
                        applyTheme(response.data.theme);
                    }
                })
                .catch(err => {
                    console.error('Error fetching theme with token:', err);
                });
        }
    }, [accessToken]);
};

export const TestSingleElimination: React.FC = () => {
    const containerRef = useDragScroll();
    useThemeWithToken();

    return (
        <div ref={containerRef} className="bracket-container">
            <Section
                section={{ ...upperBracket, title: "Single Elimination Bracket" }}
                layoutType="binary"
            />
        </div>
    );
};

export const TestDoubleElimination: React.FC = () => {
    const containerRef = useDragScroll();
    useThemeWithToken();

    return (
        <div ref={containerRef} className="bracket-container">
            <Section section={upperBracket} layoutType="binary" />
            <Section section={lowerBracket} layoutType="linear" />
        </div>
    );
};
