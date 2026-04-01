import type {
  Mine,
  Mineral,
  NewsArticle,
  PriceHistory,
  UserAlert,
  UserProfile,
} from "@/types";

/**
 * Profil utilisateur de démonstration utilisé quand l'authentification n'est pas branchée.
 */
export const DEMO_USER_PROFILE: UserProfile = {
  id: "demo-user",
  email: "demo@minealert.app",
  fullName: "Investisseur Démo",
  plan: "free",
  watchlist: ["mineral-xau", "mineral-cu", "mineral-li"],
  alertsCount: 2,
  alertsLimit: 5,
  createdAt: new Date("2025-01-12T09:00:00.000Z").toISOString(),
};

/**
 * Minerais de démonstration cohérents avec le secteur suivi par MineAlert.
 */
export const DEMO_MINERALS: Mineral[] = [
  {
    id: "mineral-xau",
    name: "Or",
    symbol: "XAU",
    category: "precious_metals",
    unit: "oz",
    currentPrice: 1954.3,
    priceChange24h: 12.5,
    priceChangePercent24h: 0.64,
    weekHigh: 1972.8,
    weekLow: 1918.2,
    monthHigh: 1988.1,
    monthLow: 1886.4,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    description: "Métal précieux refuge mondial très suivi par les investisseurs.",
    mainProducers: ["Chine", "Australie", "Russie", "Canada"],
    useCases: ["Investissement", "Bijoux", "Électronique"],
  },
  {
    id: "mineral-xag",
    name: "Argent",
    symbol: "XAG",
    category: "precious_metals",
    unit: "oz",
    currentPrice: 24.15,
    priceChange24h: -0.12,
    priceChangePercent24h: -0.49,
    weekHigh: 24.84,
    weekLow: 23.48,
    monthHigh: 25.2,
    monthLow: 22.94,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    description: "Métal précieux à fort usage industriel, notamment dans le solaire.",
    mainProducers: ["Mexique", "Pérou", "Chine"],
    useCases: ["Bijoux", "Solaire", "Électronique"],
  },
  {
    id: "mineral-cu",
    name: "Cuivre",
    symbol: "CU",
    category: "base_metals",
    unit: "lb",
    currentPrice: 3.91,
    priceChange24h: 0.08,
    priceChangePercent24h: 2.09,
    weekHigh: 3.96,
    weekLow: 3.79,
    monthHigh: 4.03,
    monthLow: 3.68,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    description: "Métal de base central pour les réseaux électriques et l'électrification.",
    mainProducers: ["Chili", "Pérou", "Congo", "Chine"],
    useCases: ["Câbles", "Construction", "Véhicules électriques"],
  },
  {
    id: "mineral-li",
    name: "Lithium",
    symbol: "LI",
    category: "battery_metals",
    unit: "tonne",
    currentPrice: 22180,
    priceChange24h: 305,
    priceChangePercent24h: 1.39,
    weekHigh: 22510,
    weekLow: 21440,
    monthHigh: 23210,
    monthLow: 20810,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    description: "Métal phare de la transition énergétique et des batteries lithium-ion.",
    mainProducers: ["Australie", "Chili", "Argentine", "Chine"],
    useCases: ["Batteries", "Céramique", "Lubrifiants"],
  },
  {
    id: "mineral-ni",
    name: "Nickel",
    symbol: "NI",
    category: "battery_metals",
    unit: "tonne",
    currentPrice: 16640,
    priceChange24h: -120,
    priceChangePercent24h: -0.72,
    weekHigh: 16920,
    weekLow: 16300,
    monthHigh: 17200,
    monthLow: 15880,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    description: "Métal stratégique pour les batteries et l'acier inoxydable.",
    mainProducers: ["Indonésie", "Philippines", "Russie"],
    useCases: ["Batteries", "Acier inox", "Alliages"],
  },
  {
    id: "mineral-u",
    name: "Uranium",
    symbol: "U",
    category: "energy_metals",
    unit: "lb",
    currentPrice: 55.9,
    priceChange24h: 0.7,
    priceChangePercent24h: 1.27,
    weekHigh: 56.4,
    weekLow: 54.1,
    monthHigh: 58.5,
    monthLow: 51.9,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    description: "Combustible nucléaire en regain d'intérêt sur les marchés.",
    mainProducers: ["Kazakhstan", "Canada", "Namibie", "Australie"],
    useCases: ["Énergie nucléaire", "Médecine", "Recherche"],
  },
];

/**
 * Construit un historique de prix crédible à partir d'un minerai et d'une période.
 */
export function buildDemoPriceHistory(
  mineral: Mineral,
  points = 30
): PriceHistory[] {
  const baseRatio = 0.94;

  return Array.from({ length: points }).map((_, index) => {
    const progress = index / Math.max(points - 1, 1);
    const amplitude = mineral.currentPrice * 0.03;
    const wave = Math.sin(progress * Math.PI * 2) * amplitude * 0.45;
    const trend = mineral.currentPrice * (baseRatio + progress * 0.06);
    const price = Number((trend + wave).toFixed(2));

    return {
      mineralId: mineral.id,
      price,
      currency: mineral.currency,
      source: "mock-market-feed",
      timestamp: new Date(
        Date.now() - (points - index) * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  });
}

/**
 * Actualités de démonstration pour le fil mondial.
 */
export const DEMO_NEWS: NewsArticle[] = [
  {
    id: "news-cu-1",
    title: "Le cuivre soutenu par la demande réseau en Amérique latine",
    summary:
      "Les opérateurs surveillent un retour de la demande cuivre sur fond d'investissements dans les réseaux électriques.",
    content:
      "Le cuivre bénéficie d'un regain d'intérêt alors que le Chili et la Chine restent au centre des flux industriels et des projets d'infrastructure.",
    url: "https://example.com/news/cuivre-reseau",
    source: "Reuters",
    sourceUrl: "https://www.reuters.com",
    publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["cuivre"],
    countries: ["Chili", "Chine"],
    sentiment: "positive",
    relevanceScore: 87,
    isBreaking: false,
  },
  {
    id: "news-li-1",
    title: "Le lithium reste sous surveillance après de nouveaux projets en Australie",
    summary:
      "Les annonces de capacité pèsent encore sur le lithium malgré une demande batterie qui reste solide.",
    content:
      "Les investisseurs suivent les nouveaux projets en Australie et en Argentine alors que le marché cherche un nouvel équilibre entre offre et demande.",
    url: "https://example.com/news/lithium-capacites",
    source: "Mining.com",
    sourceUrl: "https://www.mining.com",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["lithium"],
    countries: ["Australie", "Argentine"],
    sentiment: "neutral",
    relevanceScore: 80,
    isBreaking: false,
  },
  {
    id: "news-gold-1",
    title: "L'or profite d'un retour de l'aversion au risque",
    summary:
      "Le métal jaune retrouve de la traction avec un positionnement plus défensif des investisseurs.",
    content:
      "Les flux se redirigent vers l'or alors que plusieurs marchés revalorisent le rôle de valeur refuge dans un contexte plus instable.",
    url: "https://example.com/news/or-refuge",
    source: "Kitco",
    sourceUrl: "https://www.kitco.com",
    publishedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["or"],
    countries: ["États-Unis"],
    sentiment: "positive",
    relevanceScore: 91,
    isBreaking: true,
  },
  {
    id: "news-uranium-1",
    title: "L'uranium se raffermit avec la reprise des discussions nucléaires",
    summary:
      "Le marché observe une demande plus soutenue pour les approvisionnements en uranium.",
    content:
      "Le Kazakhstan, le Canada et la Namibie restent au centre des scénarios de production alors que la visibilité s'améliore sur le nucléaire.",
    url: "https://example.com/news/uranium-demande",
    source: "Mining Weekly",
    sourceUrl: "https://www.miningweekly.com",
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["uranium"],
    countries: ["Kazakhstan", "Canada", "Namibie"],
    sentiment: "positive",
    relevanceScore: 82,
    isBreaking: false,
  },
];

/**
 * Alertes de démonstration synchronisées avec le profil et la watchlist.
 */
export const DEMO_ALERTS: UserAlert[] = [
  {
    id: "alert-xau-1",
    userId: DEMO_USER_PROFILE.id,
    mineralId: "mineral-xau",
    type: "price_above",
    condition: "greater_than",
    threshold: 2000,
    currency: "USD",
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    mineral: DEMO_MINERALS[0],
  },
  {
    id: "alert-cu-1",
    userId: DEMO_USER_PROFILE.id,
    mineralId: "mineral-cu",
    type: "change_percent",
    condition: "greater_than",
    threshold: 2,
    currency: "USD",
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    mineral: DEMO_MINERALS[2],
  },
];

/**
 * Mines de démonstration pour la carte mondiale.
 */
export const DEMO_MINES: Mine[] = [
  {
    id: "mine-1",
    name: "Escondida",
    company: "BHP",
    country: "Chili",
    region: "Antofagasta",
    latitude: -24.27,
    longitude: -69.08,
    minerals: ["cuivre"],
    status: "active",
    production: 1100,
    productionUnit: "kt/an",
    description: "Grande mine de cuivre à ciel ouvert, référence mondiale du secteur.",
    website: "https://www.bhp.com",
  },
  {
    id: "mine-2",
    name: "Greenbushes",
    company: "Talison Lithium",
    country: "Australie",
    region: "Western Australia",
    latitude: -33.85,
    longitude: 116.06,
    minerals: ["lithium"],
    status: "active",
    production: 1600,
    productionUnit: "kt/an",
    description: "Actif majeur du lithium spodumène en Australie occidentale.",
    website: "https://www.talisonlithium.com",
  },
  {
    id: "mine-3",
    name: "Cigar Lake",
    company: "Cameco",
    country: "Canada",
    region: "Saskatchewan",
    latitude: 58.05,
    longitude: -104.69,
    minerals: ["uranium"],
    status: "active",
    production: 6900,
    productionUnit: "t/an",
    description: "Mine d'uranium à très haute teneur, stratégique pour l'offre mondiale.",
    website: "https://www.cameco.com",
  },
  {
    id: "mine-4",
    name: "Mponeng",
    company: "Harmony Gold",
    country: "Afrique du Sud",
    region: "Gauteng",
    latitude: -26.41,
    longitude: 27.42,
    minerals: ["or"],
    status: "active",
    production: 8.5,
    productionUnit: "t/an",
    description: "Mine aurifère profonde emblématique du bassin sud-africain.",
    website: "https://www.harmony.co.za",
  },
  {
    id: "mine-5",
    name: "Tenke Fungurume",
    company: "CMOC",
    country: "Congo",
    region: "Lualaba",
    latitude: -10.61,
    longitude: 26.36,
    minerals: ["cuivre", "cobalt"],
    status: "active",
    production: 250,
    productionUnit: "kt/an",
    description: "Actif majeur du cuivre et du cobalt en République démocratique du Congo.",
    website: "https://www.cmocglobal.com",
  },
];
