import React, { useMemo, memo, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { BracketSection } from '../data/mockData';
import { Match } from './Match';
import { useDragScroll } from '../hooks/useDragScroll';
import { fetchBracketData } from '../services/api';
import { transformUpperBracket, transformLowerBracket, transformFinalsBracket, transformSingleEliminationBracket } from '../utils/transformBracket';
import '../styles/bracket.scss';
import { applyTheme } from './ThemeController';

// Constants for layout
const ROW_HEIGHT = 120; // Spacing unit (Match Height 82 + Gap)

// Memoized helper to get Y position for Upper Bracket (Binary Tree)
// Cache results to avoid recalculations
const yPositionCache = new Map<string, number>();

const getYPosition = (roundIndex: number, matchIndex: number): number => {
  const cacheKey = `${roundIndex}-${matchIndex}`;
  if (yPositionCache.has(cacheKey)) {
    return yPositionCache.get(cacheKey)!;
  }

  let result: number;
  // Base case: Round 0 (R1)
  if (roundIndex === 0) {
    result = matchIndex * ROW_HEIGHT;
  } else {
    // Recursive step: Position is average of children in previous round
    // We assume strict binary tree: Match i in Round R comes from 2*i and 2*i+1 in Round R-1
    const child1Y = getYPosition(roundIndex - 1, matchIndex * 2);
    const child2Y = getYPosition(roundIndex - 1, matchIndex * 2 + 1);
    result = (child1Y + child2Y) / 2;
  }

  yPositionCache.set(cacheKey, result);
  return result;
};

export interface SectionProps {
  section: BracketSection;
  layoutType?: 'binary' | 'linear';
}

export const Section: React.FC<SectionProps> = memo(({ section, layoutType = 'linear' }) => {
  const isBinary = layoutType === 'binary';

  const totalTreeHeight = useMemo(() => {
    if (!isBinary || !section.rounds.length || !section.rounds[0].matches.length) {
      return 'auto';
    }
    return section.rounds[0].matches.length * ROW_HEIGHT;
  }, [isBinary, section]);

  return (
    <div className={`bracket-container__section ${isBinary ? 'binary-layout' : ''}`}>
      <h2 className="section-title">{section.title}</h2>
      <div className="bracket-container__rounds">
        {section.rounds.map((round, roundIndex) => {
          // For binary layout, we calculate the height of the container to fit everything
          // The height is determined by the first round's items

          return (
            <div
              key={round.id}
              className="round"
              style={{ height: totalTreeHeight, position: isBinary ? 'relative' : 'static' }}
            >
              <div className="round__header">
                {round.name} <span className="bo-badge">({round.bo > 1 ? `Bo${round.bo}` : 'Bo1'})</span>
              </div>
              <div className="round__matches" style={{ position: isBinary ? 'relative' : 'static', height: '100%' }}>
                {round.matches.map((match, matchIndex) => {
                  const topPos = isBinary ? getYPosition(roundIndex, matchIndex) : 0;

                  // Connector Logic
                  // We draw lines for matches that have a "next" match.
                  // In binary tree, all matches except the last round have a next match.
                  // The "next" match is at matchIndex // 2 in the next round.
                  // If this is an even match (0, 2...), it's the top child.
                  // If this is an odd match (1, 3...), it's the bottom child.

                  const hasNext = roundIndex < section.rounds.length - 1;
                  const isTopChild = matchIndex % 2 === 0;

                  return (
                    <div
                      key={match.id}
                      className="match-wrapper-absolute"
                      style={isBinary ? { position: 'absolute', top: `${topPos}px`, left: 0 } : {}}
                    >
                      <Match
                        match={match}
                        roundIndex={roundIndex}
                        matchIndex={matchIndex}
                        totalMatches={round.matches.length}
                        isLastRound={!hasNext}
                        isFinals={round.isFinals || false}
                      />

                      {/* CSS Lines for Binary Layout */}
                      {isBinary && hasNext && (
                        <>
                          {/* Horizontal line out to the right */}
                          <div className="line-horizontal" />

                          {/* Vertical line connecting this match to its sibling */}
                          {/* Draw vertical line downwards if Top Child, upwards if Bottom Child? */}
                          {/* Actually, drawing a single vertical line from Top Child down to Bottom Child is easier. */}
                          {isTopChild && (
                            <div
                              className="line-vertical"
                              style={{
                                height: `${getYPosition(roundIndex, matchIndex + 1) - topPos}px`
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const BracketViewer: React.FC = () => {
  console.log('BracketViewer component rendering');
  const { leagueId } = useParams<{ leagueId: string }>();
  console.log('BracketViewer - leagueId from params:', leagueId);
  const containerRef = useDragScroll();
  const [upperBracket, setUpperBracket] = useState<BracketSection | null>(null);
  const [lowerBracket, setLowerBracket] = useState<BracketSection | null>(null);
  const [finalsBracket, setFinalsBracket] = useState<BracketSection | null>(null);
  const [singleElimBracket, setSingleElimBracket] = useState<BracketSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formatType, setFormatType] = useState<string>('');

  useEffect(() => {
    console.log('BracketViewer useEffect triggered, leagueId:', leagueId);

    if (!leagueId) {
      setError('No league ID provided');
      setLoading(false);
      return;
    }

    const loadBracketData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching bracket data for leagueId:', leagueId);
        const response = await fetchBracketData(leagueId);
        console.log('Bracket data received:', response);

        // Apply theme if available
        if (response.data.theme) {
          console.log('Applying theme from bracket data');
          applyTheme(response.data.theme);
        }

        const format = response.data.format_type || '';
        setFormatType(format);

        // Check if it's single elimination - combine upper and finals
        if (format === 'single_elim') {
          const combinedBracket = await transformSingleEliminationBracket(response);
          setSingleElimBracket(combinedBracket);
          setUpperBracket(null);
          setLowerBracket(null);
          setFinalsBracket(null);
        } else {
          // Double elimination or other formats - show separate sections
          const [upper, lower, finals] = await Promise.all([
            transformUpperBracket(response),
            transformLowerBracket(response),
            transformFinalsBracket(response),
          ]);

          setUpperBracket(upper);
          setLowerBracket(lower);
          setFinalsBracket(finals);
          setSingleElimBracket(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bracket data');
        console.error('Error fetching bracket data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBracketData();
  }, [leagueId]);

  if (loading) {
    const apiUrl = `/api/v1/tournaments/${leagueId}/bracket`;
    return (
      <div className="bracket-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '10px' }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading bracket...</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Fetching: {apiUrl}</div>
        <div className="loading-spinner" style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginTop: '10px'
        }} />
        <style>{`
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bracket-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#ff4444' }}>Error: {error}</div>
      </div>
    );
  }

  if (!upperBracket && !lowerBracket && !finalsBracket && !singleElimBracket) {
    return (
      <div className="bracket-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-primary)' }}>No bracket data available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bracket-container">
      {/* Single Elimination - Show combined bracket */}
      {formatType === 'single_elim' && singleElimBracket && (
        <Section section={singleElimBracket} layoutType="binary" />
      )}

      {/* Double Elimination - Show separate sections */}
      {formatType !== 'single_elim' && (
        <>
          {/* Upper Bracket using Binary Tree Layout (includes finals) */}
          {upperBracket && <Section section={upperBracket} layoutType="binary" />}

          {/* Lower Bracket using Linear Layout (stacking) */}
          {lowerBracket && <Section section={lowerBracket} layoutType="linear" />}
        </>
      )}
    </div>
  );
};
