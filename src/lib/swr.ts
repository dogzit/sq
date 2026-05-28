import useSWR, { type SWRConfiguration } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,     // don't refetch when tab gains focus
  revalidateIfStale: true,
  dedupingInterval: 5000,       // dedupe same requests within 5s
  errorRetryCount: 2,
};

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, {
    ...defaultConfig,
    dedupingInterval: 30000,    // user data rarely changes — 30s cache
  });
  return {
    user: data?.user,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useQuests(lobbyId?: string) {
  const url = lobbyId ? `/api/quests?lobbyId=${lobbyId}` : "/api/quests";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, defaultConfig);
  return {
    quests: data?.quests || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useLobbies() {
  const { data, error, isLoading, mutate } = useSWR("/api/lobbies", fetcher, defaultConfig);
  return {
    lobbies: data?.lobbies || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useLobby(lobbyId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    lobbyId ? `/api/lobbies/${lobbyId}` : null,
    fetcher,
    defaultConfig
  );
  return {
    lobby: data?.lobby,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useSubmissions(questId?: string) {
  const url = questId ? `/api/submissions?questId=${questId}` : "/api/submissions";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, defaultConfig);
  return {
    submissions: data?.submissions || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useLeaderboard(lobbyId?: string) {
  const url = lobbyId ? `/api/leaderboard?lobbyId=${lobbyId}` : "/api/leaderboard";
  const { data, error, isLoading } = useSWR(url, fetcher, {
    ...defaultConfig,
    dedupingInterval: 15000,
  });
  return {
    leaderboard: data?.leaderboard || [],
    isLoading,
    isError: error,
  };
}

export function useShop() {
  const { data, error, isLoading, mutate } = useSWR("/api/shop", fetcher, defaultConfig);
  return {
    items: data?.items || [],
    purchased: data?.purchased || [],
    userXp: data?.userXp || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useLocations(lobbyId: string) {
  const { data, error, isLoading } = useSWR(
    lobbyId ? `/api/location?lobbyId=${lobbyId}` : null,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 10000,  // auto-refresh every 10s for live map
      dedupingInterval: 3000,
    }
  );
  return {
    locations: data?.locations || [],
    fogOfWar: data?.fogOfWar || false,
    visibleUntil: data?.visibleUntil,
    isLoading,
    isError: error,
  };
}
