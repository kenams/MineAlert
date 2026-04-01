import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

const nowIso = new Date().toISOString();

const minerals = [
  {
    id: "mineral-xau",
    name: "Or",
    symbol: "XAU",
    category: "precious_metals",
    unit: "oz",
    current_price: 1954.3,
    price_change_24h: 12.5,
    price_change_percent: 0.64,
    week_high: 1972.8,
    week_low: 1918.2,
    month_high: 1988.1,
    month_low: 1886.4,
    currency: "USD",
    description: "Metal precieux refuge mondial tres suivi par les investisseurs.",
    main_producers: ["Chine", "Australie", "Russie", "Canada"],
    use_cases: ["Investissement", "Bijoux", "Electronique"],
    image_url: null,
    is_active: true,
    last_updated: nowIso,
  },
  {
    id: "mineral-xag",
    name: "Argent",
    symbol: "XAG",
    category: "precious_metals",
    unit: "oz",
    current_price: 24.15,
    price_change_24h: -0.12,
    price_change_percent: -0.49,
    week_high: 24.84,
    week_low: 23.48,
    month_high: 25.2,
    month_low: 22.94,
    currency: "USD",
    description: "Metal precieux a fort usage industriel, notamment dans le solaire.",
    main_producers: ["Mexique", "Perou", "Chine"],
    use_cases: ["Bijoux", "Solaire", "Electronique"],
    image_url: null,
    is_active: true,
    last_updated: nowIso,
  },
  {
    id: "mineral-cu",
    name: "Cuivre",
    symbol: "CU",
    category: "base_metals",
    unit: "lb",
    current_price: 3.91,
    price_change_24h: 0.08,
    price_change_percent: 2.09,
    week_high: 3.96,
    week_low: 3.79,
    month_high: 4.03,
    month_low: 3.68,
    currency: "USD",
    description: "Metal de base central pour les reseaux electriques et l'electrification.",
    main_producers: ["Chili", "Perou", "Congo", "Chine"],
    use_cases: ["Cables", "Construction", "Vehicules electriques"],
    image_url: null,
    is_active: true,
    last_updated: nowIso,
  },
  {
    id: "mineral-li",
    name: "Lithium",
    symbol: "LI",
    category: "battery_metals",
    unit: "tonne",
    current_price: 22180,
    price_change_24h: 305,
    price_change_percent: 1.39,
    week_high: 22510,
    week_low: 21440,
    month_high: 23210,
    month_low: 20810,
    currency: "USD",
    description: "Metal phare de la transition energetique et des batteries lithium-ion.",
    main_producers: ["Australie", "Chili", "Argentine", "Chine"],
    use_cases: ["Batteries", "Ceramique", "Lubrifiants"],
    image_url: null,
    is_active: true,
    last_updated: nowIso,
  },
  {
    id: "mineral-ni",
    name: "Nickel",
    symbol: "NI",
    category: "battery_metals",
    unit: "tonne",
    current_price: 16640,
    price_change_24h: -120,
    price_change_percent: -0.72,
    week_high: 16920,
    week_low: 16300,
    month_high: 17200,
    month_low: 15880,
    currency: "USD",
    description: "Metal strategique pour les batteries et l'acier inoxydable.",
    main_producers: ["Indonesie", "Philippines", "Russie"],
    use_cases: ["Batteries", "Acier inox", "Alliages"],
    image_url: null,
    is_active: true,
    last_updated: nowIso,
  },
  {
    id: "mineral-u",
    name: "Uranium",
    symbol: "U",
    category: "energy_metals",
    unit: "lb",
    current_price: 55.9,
    price_change_24h: 0.7,
    price_change_percent: 1.27,
    week_high: 56.4,
    week_low: 54.1,
    month_high: 58.5,
    month_low: 51.9,
    currency: "USD",
    description: "Combustible nucleaire en regain d'interet sur les marches.",
    main_producers: ["Kazakhstan", "Canada", "Namibie", "Australie"],
    use_cases: ["Energie nucleaire", "Medecine", "Recherche"],
    image_url: null,
    is_active: true,
    last_updated: nowIso,
  },
];

function buildPriceHistory() {
  return minerals.flatMap((mineral) => {
    const points = 30;
    return Array.from({ length: points }).map((_, index) => {
      const progress = index / Math.max(points - 1, 1);
      const amplitude = mineral.current_price * 0.03;
      const wave = Math.sin(progress * Math.PI * 2) * amplitude * 0.45;
      const trend = mineral.current_price * (0.94 + progress * 0.06);
      const price = Number((trend + wave).toFixed(2));

      return {
        mineral_id: mineral.id,
        price,
        currency: mineral.currency,
        source: "minealert-seed",
        recorded_at: new Date(
          Date.now() - (points - index) * 24 * 60 * 60 * 1000
        ).toISOString(),
      };
    });
  });
}

const newsArticles = [
  {
    id: "9f687b50-c0ce-4cd5-b99c-a67536429901",
    title: "Le cuivre soutenu par la demande reseau en Amerique latine",
    summary:
      "Les operateurs surveillent un retour de la demande cuivre sur fond d'investissements dans les reseaux electriques.",
    content:
      "Le cuivre beneficie d'un regain d'interet alors que le Chili et la Chine restent au centre des flux industriels et des projets d'infrastructure.",
    url: "https://minealert.local/news/cuivre-reseau",
    source: "Reuters",
    source_url: "https://www.reuters.com",
    published_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    scraped_at: nowIso,
    minerals: ["cuivre"],
    countries: ["Chili", "Chine"],
    sentiment: "positive",
    relevance_score: 87,
    image_url: null,
    is_breaking: false,
  },
  {
    id: "9f687b50-c0ce-4cd5-b99c-a67536429902",
    title: "Le lithium reste sous surveillance apres de nouveaux projets en Australie",
    summary:
      "Les annonces de capacite pesent encore sur le lithium malgre une demande batterie qui reste solide.",
    content:
      "Les investisseurs suivent les nouveaux projets en Australie et en Argentine alors que le marche cherche un nouvel equilibre entre offre et demande.",
    url: "https://minealert.local/news/lithium-capacites",
    source: "Mining.com",
    source_url: "https://www.mining.com",
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    scraped_at: nowIso,
    minerals: ["lithium"],
    countries: ["Australie", "Argentine"],
    sentiment: "neutral",
    relevance_score: 80,
    image_url: null,
    is_breaking: false,
  },
  {
    id: "9f687b50-c0ce-4cd5-b99c-a67536429903",
    title: "L'or profite d'un retour de l'aversion au risque",
    summary:
      "Le metal jaune retrouve de la traction avec un positionnement plus defensif des investisseurs.",
    content:
      "Les flux se redirigent vers l'or alors que plusieurs marches revalorisent le role de valeur refuge dans un contexte plus instable.",
    url: "https://minealert.local/news/or-refuge",
    source: "Kitco",
    source_url: "https://www.kitco.com",
    published_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    scraped_at: nowIso,
    minerals: ["or"],
    countries: ["Etats-Unis"],
    sentiment: "positive",
    relevance_score: 91,
    image_url: null,
    is_breaking: true,
  },
  {
    id: "9f687b50-c0ce-4cd5-b99c-a67536429904",
    title: "L'uranium se raffermit avec la reprise des discussions nucleaires",
    summary:
      "Le marche observe une demande plus soutenue pour les approvisionnements en uranium.",
    content:
      "Le Kazakhstan, le Canada et la Namibie restent au centre des scenarios de production alors que la visibilite s'ameliore sur le nucleaire.",
    url: "https://minealert.local/news/uranium-demande",
    source: "Mining Weekly",
    source_url: "https://www.miningweekly.com",
    published_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    scraped_at: nowIso,
    minerals: ["uranium"],
    countries: ["Kazakhstan", "Canada", "Namibie"],
    sentiment: "positive",
    relevance_score: 82,
    image_url: null,
    is_breaking: false,
  },
];

const mines = [
  {
    id: "4fa838bb-c6dd-4475-a4a1-6247e303f101",
    name: "Escondida",
    company: "BHP",
    country: "Chili",
    region: "Antofagasta",
    latitude: -24.27,
    longitude: -69.08,
    minerals: ["cuivre"],
    status: "active",
    production: 1100,
    production_unit: "kt/an",
    description: "Grande mine de cuivre a ciel ouvert, reference mondiale du secteur.",
    website: "https://www.bhp.com",
  },
  {
    id: "4fa838bb-c6dd-4475-a4a1-6247e303f102",
    name: "Greenbushes",
    company: "Talison Lithium",
    country: "Australie",
    region: "Western Australia",
    latitude: -33.85,
    longitude: 116.06,
    minerals: ["lithium"],
    status: "active",
    production: 1600,
    production_unit: "kt/an",
    description: "Actif majeur du lithium spodumene en Australie occidentale.",
    website: "https://www.talisonlithium.com",
  },
  {
    id: "4fa838bb-c6dd-4475-a4a1-6247e303f103",
    name: "Cigar Lake",
    company: "Cameco",
    country: "Canada",
    region: "Saskatchewan",
    latitude: 58.05,
    longitude: -104.69,
    minerals: ["uranium"],
    status: "active",
    production: 6900,
    production_unit: "t/an",
    description: "Mine d'uranium a tres haute teneur, strategique pour l'offre mondiale.",
    website: "https://www.cameco.com",
  },
  {
    id: "4fa838bb-c6dd-4475-a4a1-6247e303f104",
    name: "Mponeng",
    company: "Harmony Gold",
    country: "Afrique du Sud",
    region: "Gauteng",
    latitude: -26.41,
    longitude: 27.42,
    minerals: ["or"],
    status: "active",
    production: 8.5,
    production_unit: "t/an",
    description: "Mine aurifere profonde emblematique du bassin sud-africain.",
    website: "https://www.harmony.co.za",
  },
  {
    id: "4fa838bb-c6dd-4475-a4a1-6247e303f105",
    name: "Tenke Fungurume",
    company: "CMOC",
    country: "Congo",
    region: "Lualaba",
    latitude: -10.61,
    longitude: 26.36,
    minerals: ["cuivre", "cobalt"],
    status: "active",
    production: 250,
    production_unit: "kt/an",
    description: "Actif majeur du cuivre et du cobalt en Republique democratique du Congo.",
    website: "https://www.cmocglobal.com",
  },
];

async function main() {
  const env = loadEnv(path.join(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const legacyServiceKey = env.SUPABASE_SERVICE_KEY;
  const serviceKey = serviceRoleKey || legacyServiceKey;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  if (!serviceRoleKey && legacyServiceKey) {
    console.warn(
      '[MineAlert] "SUPABASE_SERVICE_KEY" is deprecated. Use "SUPABASE_SERVICE_ROLE_KEY" instead.'
    );
  }

  const client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const history = buildPriceHistory();

  const { error: mineralsError } = await client
    .from("minerals")
    .upsert(minerals, { onConflict: "id" });
  if (mineralsError) {
    throw mineralsError;
  }

  const mineralIds = minerals.map((mineral) => mineral.id);
  const { error: deleteHistoryError } = await client
    .from("price_history")
    .delete()
    .in("mineral_id", mineralIds);
  if (deleteHistoryError) {
    throw deleteHistoryError;
  }

  const { error: historyError } = await client
    .from("price_history")
    .insert(history);
  if (historyError) {
    throw historyError;
  }

  const newsIds = newsArticles.map((article) => article.id);
  const { error: deleteNewsError } = await client
    .from("news_articles")
    .delete()
    .in("id", newsIds);
  if (deleteNewsError) {
    throw deleteNewsError;
  }

  const { error: newsError } = await client
    .from("news_articles")
    .insert(newsArticles);
  if (newsError) {
    throw newsError;
  }

  const { error: minesError } = await client
    .from("mines")
    .upsert(mines, { onConflict: "id" });
  if (minesError) {
    throw minesError;
  }

  const summary = {
    minerals: minerals.length,
    price_history: history.length,
    news_articles: newsArticles.length,
    mines: mines.length,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
