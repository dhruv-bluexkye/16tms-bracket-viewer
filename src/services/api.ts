export interface ApiBracketMatch {
  round: number;
  match_number: number;
  league_round_id: string;
  round_name: string;
  round_description: string | null;
  round_team_count: number | null;
  round_matches_per_group: number | null;
  round_start: string | null;
  round_end: string | null;
  round_type: string | null;
  group_id: string | null;
  participant1_id: string | null;
  participant2_id: string | null;
  next_match_if_win: number;
  next_match_if_loss: number;
  bracket_type: 'upper' | 'lower' | 'final';
  match_type: string;
  best_of: string;
  extra_data: {
    round: number;
    round_name: string;
    bracket_type: string;
    match_number: number;
    next_match_if_win: number;
    next_match_if_loss: number;
  };
}

export interface ApiBracketResponse {
  success: boolean;
  message: string;
  data: {
    league_id?: string;
    tournament_id?: string; // Add tournament_id as it appears in the JSON
    format_type: string;
    best_of_default: string;
    third_place: boolean;
    bracket: {
      upper: ApiBracketMatch[] | null;
      lower: ApiBracketMatch[] | null;
      finals: ApiBracketMatch[] | null;
    };
    theme?: ApiThemeResponse['data']['theme'];
  };
  error: string | null;
}

export interface ApiTeamResponse {
  success: boolean;
  message: string;
  data: {
    teamId: string;
    name: string;
    description: string;
    teamSize: number;
    ownerId: string;
    ownerName: string;
    logo: string;
    coverImage: string;
    gameId: string;
    gameName: string;
    gameImage: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    facebookUrl: string | null;
    twitterUrl: string | null;
    instagramUrl: string | null;
    youTubeUrl: string | null;
    discordUrl: string | null;
    twitchUrl: string | null;
    members: Array<{
      userId: string;
      email: string;
      username: string;
      role: string;
      isActive: boolean;
      joinedAt: string;
      profileImage: string;
      gameId: string;
      userGameId: string;
    }>;
  };
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getApiUrl(path: string): string {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return baseUrl ? `${baseUrl}${path}` : path;
}

export async function fetchBracketData(leagueId: string): Promise<ApiBracketResponse> {
  const apiPath = getApiUrl(`/api/v1/tournaments/${leagueId}/bracket`);

  console.log('API Call - URL:', apiPath);
  console.log('API Call - leagueId:', leagueId);

  const response = await fetch(apiPath, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('API Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error response:', errorText);
    throw new Error(`Failed to fetch bracket data: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('API Response data:', data);
  return data;
}

export async function fetchTeamData(teamId: string): Promise<ApiTeamResponse> {
  const apiPath = getApiUrl(`/api/Team/${teamId}`);

  console.log('Fetching team data - URL:', apiPath);

  const response = await fetch(apiPath, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Team API Error response:', errorText);
    throw new Error(`Failed to fetch team data: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export interface ApiThemeResponse {
  success: boolean;
  message: string;
  data: {
    theme: {
      colors: {
        background: string;
        card: {
          backgroundStart: string;
          backgroundEnd: string;
          hover?: string;
          shadow?: string;
        };
        text: {
          primary: string;
          secondary: string;
        };
        accent: string;
        line: string;
        border: string;
        headerBackground: string;
        winnerBackground: string;
      };
      layout: {
        matchWidth: string;
        roundGap: string;
      };
    };
  };
}

export async function fetchTenantTheme(accessToken: string): Promise<ApiThemeResponse> {
  const apiPath = getApiUrl('/api/v1/tenant/bracket-theme');

  console.log('Fetching tenant theme - URL:', apiPath);

  const response = await fetch(apiPath, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}` // Fixed: Use template literal correctly
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Theme API Error response:', errorText);
    throw new Error(`Failed to fetch theme data: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
