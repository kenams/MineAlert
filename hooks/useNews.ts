import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  LIVE_NEWS_REFRESH_MS,
  NEWS_PAGE_SIZE,
} from "@/lib/utils/constants";
import type { ApiResponse, NewsArticle, NewsFilters } from "@/types";

type NewsResult = {
  articles: NewsArticle[];
  total: number;
  page: number;
  totalPages: number;
};

type NewsApiPayload =
  | NewsResult
  | ApiResponse<NewsArticle[]>
  | ApiResponse<NewsResult>;

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: "news-1",
    title: "Le cuivre soutenu par une demande industrielle plus resiliente",
    summary:
      "Les operateurs surveillent un rebond de la demande lie aux infrastructures et aux reseaux electriques.",
    content:
      "Le marche du cuivre retrouve un peu d'elan avec une meilleure tenue des achats industriels en Asie.",
    url: "https://example.com/cuivre-demande",
    source: "Reuters",
    sourceUrl: "https://www.reuters.com",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["cuivre"],
    countries: ["Chili", "Chine"],
    sentiment: "positive",
    relevanceScore: 84,
    isBreaking: false,
  },
  {
    id: "news-2",
    title: "Le lithium reste sous pression malgre les attentes sur les batteries",
    summary:
      "Les prix restent volatils alors que les capacites de production continuent d'augmenter.",
    content:
      "Les investisseurs surveillent les annonces de nouveaux projets et la vitesse de reprise de la demande.",
    url: "https://example.com/lithium-volatilite",
    source: "Mining.com",
    sourceUrl: "https://www.mining.com",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["lithium"],
    countries: ["Australie", "Argentine"],
    sentiment: "neutral",
    relevanceScore: 78,
    isBreaking: false,
  },
  {
    id: "news-3",
    title: "L'or profite d'un regain d'aversion au risque",
    summary:
      "Le metal jaune attire a nouveau les flux defensifs dans un contexte de marche plus nerveux.",
    content:
      "Les tensions geopolitiques redonnent de la visibilite a l'or comme actif de protection.",
    url: "https://example.com/or-refuge",
    source: "Kitco",
    sourceUrl: "https://www.kitco.com",
    publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["or"],
    countries: ["Etats-Unis"],
    sentiment: "positive",
    relevanceScore: 88,
    isBreaking: true,
  },
];

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    "data" in payload
  );
}

function buildNewsQuery(filters?: NewsFilters): string {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.mineral) {
    params.set("mineral", filters.mineral);
  }

  if (filters.country) {
    params.set("country", filters.country);
  }

  if (filters.sentiment) {
    params.set("sentiment", filters.sentiment);
  }

  if (filters.source) {
    params.set("source", filters.source);
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function applyNewsFilters(
  articles: NewsArticle[],
  filters?: NewsFilters
): NewsArticle[] {
  return articles.filter((article) => {
    if (filters?.mineral && !article.minerals.includes(filters.mineral)) {
      return false;
    }

    if (filters?.country && !article.countries.includes(filters.country)) {
      return false;
    }

    if (filters?.sentiment && article.sentiment !== filters.sentiment) {
      return false;
    }

    if (filters?.source && article.source !== filters.source) {
      return false;
    }

    return true;
  });
}

function normalizeNewsResult(
  payload: NewsApiPayload,
  filters?: NewsFilters
): NewsResult {
  if (isApiResponse<NewsResult>(payload) && payload.data) {
    return payload.data;
  }

  if (isApiResponse<NewsArticle[]>(payload)) {
    const articles = payload.data ?? [];
    return {
      articles,
      total: articles.length,
      page: filters?.page ?? 1,
      totalPages: Math.max(1, Math.ceil(articles.length / NEWS_PAGE_SIZE)),
    };
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "articles" in payload &&
    Array.isArray(payload.articles)
  ) {
    const candidate = payload as NewsResult;
    return {
      articles: candidate.articles,
      total: candidate.total,
      page: candidate.page,
      totalPages: candidate.totalPages,
    };
  }

  return {
    articles: [],
    total: 0,
    page: filters?.page ?? 1,
    totalPages: 1,
  };
}

function buildMockNewsResult(filters?: NewsFilters): NewsResult {
  const filteredArticles = applyNewsFilters(MOCK_ARTICLES, filters);
  const currentPage = filters?.page ?? 1;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / NEWS_PAGE_SIZE)
  );
  const startIndex = (currentPage - 1) * NEWS_PAGE_SIZE;

  return {
    articles: filteredArticles.slice(startIndex, startIndex + NEWS_PAGE_SIZE),
    total: filteredArticles.length,
    page: currentPage,
    totalPages,
  };
}

async function fetchNews(filters?: NewsFilters): Promise<NewsResult> {
  try {
    const response = await fetch(`/api/actualites${buildNewsQuery(filters)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les actualites.");
    }

    const payload = (await response.json()) as NewsApiPayload;
    return normalizeNewsResult(payload, filters);
  } catch {
    if (isSupabaseConfigured()) {
      return {
        articles: [],
        total: 0,
        page: filters?.page ?? 1,
        totalPages: 1,
      };
    }

    return buildMockNewsResult(filters);
  }
}

export function useNews(filters?: NewsFilters) {
  const query = useQuery({
    queryKey: ["news", filters],
    queryFn: () => fetchNews(filters),
    staleTime: LIVE_NEWS_REFRESH_MS,
    refetchInterval: LIVE_NEWS_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  return {
    articles: query.data?.articles ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters?.page ?? 1,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
