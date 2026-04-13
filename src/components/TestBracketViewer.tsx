import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Section } from './Bracket';
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
    useThemeWithToken();

    return (
        <TransformWrapper
            initialScale={1}
            minScale={0.3}
            maxScale={2}
            centerOnInit
            limitToBounds={false}
            panning={{ velocityDisabled: false }}
        >
            {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="scroll-shell" onDoubleClick={() => resetTransform()}>
                    {/* Floating Controls */}
                    <div className="bracket-controls">
                        <button onClick={() => zoomIn()} title="Zoom In"><ZoomIn /></button>
                        <button onClick={() => zoomOut()} title="Zoom Out"><ZoomOut /></button>
                        <button onClick={() => resetTransform()} title="Reset View"><RotateCcw /></button>
                    </div>

                    {/* Zoomable Area */}
                    <TransformComponent
                        wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden" }}
                        contentStyle={{ 
                            width: "max-content", 
                            height: "max-content", 
                            display: "flex", 
                            flexDirection: "column",
                            minWidth: "100%",
                            minHeight: "100%"
                        }}
                    >
                        <div className="bracket-container">
                            <Section
                                section={{ ...upperBracket, title: "Single Elimination Bracket" }}
                                layoutType="binary"
                            />
                        </div>
                    </TransformComponent>
                </div>
            )}
        </TransformWrapper>
    );
};

export const TestDoubleElimination: React.FC = () => {
    useThemeWithToken();

    return (
        <TransformWrapper
            initialScale={1}
            minScale={0.3}
            maxScale={2}
            centerOnInit
            limitToBounds={false}
            panning={{ velocityDisabled: false }}
        >
            {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="scroll-shell" onDoubleClick={() => resetTransform()}>
                    {/* Floating Controls */}
                    <div className="bracket-controls">
                        <button onClick={() => zoomIn()} title="Zoom In"><ZoomIn /></button>
                        <button onClick={() => zoomOut()} title="Zoom Out"><ZoomOut /></button>
                        <button onClick={() => resetTransform()} title="Reset View"><RotateCcw /></button>
                    </div>

                    {/* Zoomable Area */}
                    <TransformComponent
                        wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden" }}
                        contentStyle={{ 
                            width: "max-content", 
                            height: "max-content", 
                            display: "flex", 
                            flexDirection: "column",
                            minWidth: "100%",
                            minHeight: "100%"
                        }}
                    >
                        <div className="bracket-container">
                            <Section section={upperBracket} layoutType="binary" />
                            <Section section={lowerBracket} layoutType="linear" />
                        </div>
                    </TransformComponent>
                </div>
            )}
        </TransformWrapper>
    );
};
