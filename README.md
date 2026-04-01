# MineAlert

Application Next.js de veille minière avec :
- auth Supabase (`email/password` + Google OAuth)
- dashboard, watchlist et alertes liées aux comptes utilisateurs
- scraping live des prix et actualités
- synchronisation automatique locale et Vercel Cron

## Lancement local

```bash
npm install
npm run dev
```

Application locale : `http://localhost:3000`

Le projet charge les variables depuis `.env.local`. Utilise `.env.example` comme source de vérité.

## Stratégie de configuration

MineAlert utilise maintenant une configuration unifiée avec :
- variables publiques uniquement pour l’URL Supabase, la clé publishable et l’URL canonique de l’app
- variables serveur uniquement pour la service role key, le cron secret et Resend
- compatibilité legacy temporaire, mais marquée comme dépréciée avec warning explicite
- échec explicite en production si une variable critique manque

### Variables actives

| Variable | Rôle | Côté | Obligatoire | Valeur attendue | Fallback | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL publique du projet Supabase | client + serveur | oui | `https://<project-ref>.supabase.co` | aucun en prod | active |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé publique Supabase côté navigateur | client + serveur | oui | `sb_publishable_...` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` temporairement | active |
| `SUPABASE_SERVICE_ROLE_KEY` | clé admin Supabase pour scraping, seeds et backend | serveur | oui pour admin/scraper | `sb_secret_...` | `SUPABASE_SERVICE_KEY` temporairement | active |
| `NEXT_PUBLIC_SITE_URL` | URL canonique de l’application, callbacks auth et redirects | client + serveur | oui en prod | `https://<ton-domaine>` | `http://localhost:3000` en dev, `NEXT_PUBLIC_APP_URL` temporairement | active |
| `CRON_SECRET` | secret exigé par `/api/scraper` | serveur | oui en prod | secret long aléatoire | aucun | active |
| `SCRAPER_AUTO_SYNC_ENABLED` | active le worker auto-sync Node/local | serveur | non | `true` ou `false` | `true` | active |
| `SCRAPER_BOOT_SYNC_ENABLED` | force un sync au démarrage du worker | serveur | non | `true` ou `false` | `true` | active |
| `SCRAPER_BASE_URL` | URL cible appelée par le worker auto-sync | serveur | non mais recommandée en prod | `https://<ton-domaine>` | `NEXT_PUBLIC_SITE_URL` temporairement, `http://localhost:3000` en dev | active |
| `SCRAPER_CRON_EXPRESSION` | fréquence du worker auto-sync | serveur | non | `*/5 * * * *` | `*/5 * * * *` | active |
| `RESEND_API_KEY` | envoi d’emails d’alertes | serveur | non | clé Resend | aucun, l’email est simplement désactivé | active |

### Variables legacy encore acceptées

| Variable | Remplacée par | Usage actuel | Statut |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | encore acceptée avec warning | deprecated |
| `SUPABASE_SERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | encore acceptée avec warning | deprecated |
| `NEXT_PUBLIC_APP_URL` | `NEXT_PUBLIC_SITE_URL` | encore acceptée avec warning | deprecated |
| `SCRAPER_INTERNAL_URL` | `SCRAPER_BASE_URL` | encore acceptée avec warning | deprecated |
| `SCRAPER_SYNC_CRON` | `SCRAPER_CRON_EXPRESSION` | encore acceptée avec warning | deprecated |

## OAuth Google / Supabase

Le flux OAuth fonctionne ainsi :
1. Google redirige vers Supabase
2. Supabase échange la session
3. Supabase renvoie vers `/auth/callback` de MineAlert

### URLs à configurer

Google Cloud Console → `Authorized redirect URIs`

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Supabase Dashboard → `Authentication > URL Configuration`

```text
Site URL : https://<ton-domaine-vercel>.vercel.app
Redirect URLs : https://<ton-domaine-vercel>.vercel.app/auth/callback
```

En prod, `NEXT_PUBLIC_SITE_URL` doit correspondre exactement à l’URL canonique publique de l’application.

## Cron Vercel

`vercel.json` déclenche `/api/scraper` une fois par jour à `08:00 UTC`, ce qui reste compatible avec Vercel Hobby.

Si tu passes plus tard sur Vercel Pro, tu peux remonter la fréquence à `*/5 * * * *`.

Pré-requis prod :
1. définir `CRON_SECRET` dans Vercel
2. déployer l’application avec `vercel.json`
3. vérifier les exécutions dans `Vercel Dashboard > Cron Jobs / Functions`
4. inspecter les logs JSON de `/api/scraper` et `scripts/auto_sync.mjs`

La route `/api/scraper` accepte :
- `Authorization: Bearer <CRON_SECRET>`
- `X-Cron-Secret: <CRON_SECRET>`

Si `CRON_SECRET` manque ou est vide, la route refuse toutes les requêtes.

## Notes de production

- Les clients Supabase admin et email sont marqués `server-only`
- aucune clé serveur n’est injectée côté client
- en production, l’absence de configuration critique provoque une erreur explicite
- `RESEND_API_KEY` est optionnelle : si elle manque, l’envoi d’email est ignoré proprement

## Étape optionnelle suivante

Quand tous les environnements auront migré sur les nouvelles variables, on pourra supprimer définitivement les alias legacy :
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SCRAPER_INTERNAL_URL`
- `SCRAPER_SYNC_CRON`
