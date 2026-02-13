import type { BracketSection, Round, Match, Team } from '../data/mockData';
import type { ApiBracketMatch, ApiBracketResponse } from '../services/api';
import { fetchTeamData } from '../services/api';

// Team cache to avoid fetching the same team multiple times
const teamCache = new Map<string, Team>();

// Helper to extract best of number from string like "bo3" -> 3
function extractBestOf(bestOf: string): number {
  const match = bestOf.toLowerCase().match(/bo(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// Helper to create a placeholder team
function createPlaceholderTeam(name: string = 'TBD'): Team {
  return {
    id: name,
    name,
    score: 0,
    isWinner: false,
    logo: '',
  };
}

// Fetch team data and convert to Team object
async function fetchTeam(teamId: string | null): Promise<Team> {
  if (!teamId) {
    return createPlaceholderTeam('TBD');
  }

  // Check cache first
  if (teamCache.has(teamId)) {
    return teamCache.get(teamId)!;
  }

  try {
    const teamResponse = await fetchTeamData(teamId);
    const team: Team = {
      id: teamResponse.data.teamId,
      name: teamResponse.data.name,
      score: 0, // Score will be set from match results if available
      isWinner: false, // Will be determined from match results
      logo: teamResponse.data.logo || '',
    };
    
    // Cache the team
    teamCache.set(teamId, team);
    return team;
  } catch (error) {
    console.error(`Failed to fetch team ${teamId}:`, error);
    // Return placeholder team on error
    const placeholder = createPlaceholderTeam(`Team ${teamId.substring(0, 8)}...`);
    teamCache.set(teamId, placeholder);
    return placeholder;
  }
}

// Transform API matches to app matches (async to fetch team data)
async function transformMatches(matches: ApiBracketMatch[]): Promise<Match[]> {
  const matchPromises = matches.map(async (apiMatch) => {
    const [team1, team2] = await Promise.all([
      fetchTeam(apiMatch.participant1_id),
      fetchTeam(apiMatch.participant2_id),
    ]);

    return {
      id: apiMatch.match_number,
      team1,
      team2,
      status: 'scheduled' as const, // Default to scheduled since we don't have status in API
    };
  });

  return Promise.all(matchPromises);
}

// Group matches by round and create Round objects (async to fetch team data)
async function groupMatchesByRound(matches: ApiBracketMatch[], isFinalsRound: boolean = false): Promise<Round[]> {
  // Group by round number
  const roundMap = new Map<number, ApiBracketMatch[]>();
  
  matches.forEach((match) => {
    const round = match.round;
    if (!roundMap.has(round)) {
      roundMap.set(round, []);
    }
    roundMap.get(round)!.push(match);
  });

  // Convert to Round array, sorted by round number
  const roundPromises = Array.from(roundMap.entries()).map(async ([roundNumber, roundMatches]) => {
    // Sort matches by match_number
    roundMatches.sort((a, b) => a.match_number - b.match_number);
    
    // Get best_of from first match in round (assuming all matches in a round have same best_of)
    const bestOf = extractBestOf(roundMatches[0].best_of);
    
    // Get round name from first match
    const roundName = roundMatches[0].round_name || `Round ${roundNumber}`;
    
    // Check if this is a finals round (either from bracket_type or isFinalsRound flag)
    const isFinals = isFinalsRound || roundMatches[0].bracket_type === 'final';

    const transformedMatches = await transformMatches(roundMatches);

    return {
      id: roundNumber,
      name: roundName,
      bo: bestOf,
      matches: transformedMatches,
      isFinals,
    };
  });

  const resolvedRounds = await Promise.all(roundPromises);
  return resolvedRounds.sort((a, b) => a.id - b.id);
}

// Transform API response to BracketSection for upper bracket (includes finals)
export async function transformUpperBracket(apiResponse: ApiBracketResponse): Promise<BracketSection | null> {
  const upperMatches = apiResponse.data.bracket.upper || [];
  const finalsMatches = apiResponse.data.bracket.finals || [];
  
  // Combine upper and finals for double elimination too
  const allMatches = [...upperMatches, ...finalsMatches];
  
  if (allMatches.length === 0) {
    return null;
  }

  // Group matches by round, marking finals matches
  const upperRounds = await groupMatchesByRound(upperMatches, false);
  const finalsRounds = await groupMatchesByRound(finalsMatches, true);
  
  // Combine rounds, ensuring finals come after upper
  const allRounds = [...upperRounds, ...finalsRounds].sort((a, b) => a.id - b.id);
  
  return {
    title: 'Upper Bracket',
    rounds: allRounds,
  };
}

// Transform API response to BracketSection for lower bracket
export async function transformLowerBracket(apiResponse: ApiBracketResponse): Promise<BracketSection | null> {
  const lowerMatches = apiResponse.data.bracket.lower;
  if (!lowerMatches || lowerMatches.length === 0) {
    return null;
  }

  const rounds = await groupMatchesByRound(lowerMatches);
  return {
    title: 'Lower Bracket',
    rounds,
  };
}

// Transform API response to BracketSection for finals
export async function transformFinalsBracket(apiResponse: ApiBracketResponse): Promise<BracketSection | null> {
  const finalsMatches = apiResponse.data.bracket.finals;
  if (!finalsMatches || finalsMatches.length === 0) {
    return null;
  }

  const rounds = await groupMatchesByRound(finalsMatches);
  return {
    title: 'Finals',
    rounds,
  };
}

// Transform API response for single elimination - combines upper and finals into one bracket
export async function transformSingleEliminationBracket(apiResponse: ApiBracketResponse): Promise<BracketSection | null> {
  const upperMatches = apiResponse.data.bracket.upper || [];
  const finalsMatches = apiResponse.data.bracket.finals || [];
  
  // Combine all matches from upper and finals
  const allMatches = [...upperMatches, ...finalsMatches];
  
  if (allMatches.length === 0) {
    return null;
  }

  // Group matches by round, marking finals matches
  const upperRounds = await groupMatchesByRound(upperMatches, false);
  const finalsRounds = await groupMatchesByRound(finalsMatches, true);
  
  // Combine rounds, ensuring finals come after upper
  const allRounds = [...upperRounds, ...finalsRounds].sort((a, b) => a.id - b.id);
  
  return {
    title: 'Upper Bracket',
    rounds: allRounds,
  };
}

