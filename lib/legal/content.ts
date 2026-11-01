import type { Locale } from "@/lib/i18n/locale";

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalPage = { title: string; updated: string; sections: LegalSection[] };
export type LegalKey = "legal" | "privacy" | "terms" | "contact";

const UPDATED = "2026-11-01";
const EMAIL = "kahdigital42@gmail.com";

/**
 * Contenu juridique de MineAlert (français et anglais). Éditeur : mêmes informations que les mentions légales de kah-digital.ch.
 */
export const LEGAL_CONTENT: Record<LegalKey, Record<Locale, LegalPage>> = {
  legal: {
    fr: {
      title: "Mentions légales",
      updated: UPDATED,
      sections: [
        {
          heading: "Éditeur du service",
          paragraphs: [
            "MineAlert est édité par KAH Digital Studio, nom commercial de Namake Keita, entreprise individuelle (France).",
            "SIREN : 953 058 427 · Code APE : 62.01Z · Ville : Toulouse, France.",
            `Contact : ${EMAIL}`,
            "TVA non applicable, article 293 B du Code général des impôts (franchise en base).",
            "Directeur de la publication : Namake Keita.",
          ],
        },
        {
          heading: "Hébergement et prestataires techniques",
          paragraphs: [
            "Application hébergée par Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104 (États-Unis).",
            "Base de données et authentification : Supabase (région Europe). Paiements : Stripe. Envoi d'e-mails : Resend.",
          ],
        },
        {
          heading: "Nature de l'information",
          paragraphs: [
            "MineAlert diffuse des informations factuelles : cours indicatifs de métaux (contrats à terme), dépôts réglementaires publics de sociétés cotées (SEC EDGAR) et indicateurs de gouvernance (Banque mondiale).",
            "Ces informations ne constituent ni un conseil en investissement, ni une recommandation, ni une offre d'achat ou de vente. KAH Digital Studio n'est pas conseiller en investissements financiers. Les marchés des métaux, des mines et des cryptoactifs sont risqués : une perte en capital est possible.",
          ],
        },
        {
          heading: "Propriété intellectuelle",
          paragraphs: [
            "Le code, la structure, les textes et la marque du service sont la propriété de KAH Digital Studio. Les données de tiers restent soumises aux conditions de leurs fournisseurs (Yahoo Finance, gold-api.com, SEC, Banque mondiale CC BY 4.0).",
          ],
        },
        {
          heading: "Droit applicable",
          paragraphs: ["Les présentes mentions sont soumises au droit français."],
        },
      ],
    },
    en: {
      title: "Legal notice",
      updated: UPDATED,
      sections: [
        {
          heading: "Publisher",
          paragraphs: [
            "MineAlert is published by KAH Digital Studio, the trading name of Namake Keita, a sole proprietorship (France).",
            "SIREN: 953 058 427 · APE code: 62.01Z · City: Toulouse, France.",
            `Contact: ${EMAIL}`,
            "VAT not applicable, article 293 B of the French General Tax Code.",
            "Publication director: Namake Keita.",
          ],
        },
        {
          heading: "Hosting and technical providers",
          paragraphs: [
            "Application hosted by Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104 (USA).",
            "Database and authentication: Supabase (European region). Payments: Stripe. Email delivery: Resend.",
          ],
        },
        {
          heading: "Nature of the information",
          paragraphs: [
            "MineAlert publishes factual information: indicative metal prices (futures contracts), public regulatory filings of listed companies (SEC EDGAR) and governance indicators (World Bank).",
            "This information is not investment advice, a recommendation, or an offer to buy or sell. KAH Digital Studio is not a licensed investment adviser. Metal, mining and crypto-asset markets are risky: you can lose your capital.",
          ],
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "The code, structure, texts and brand of the service belong to KAH Digital Studio. Third-party data remains subject to its providers' terms (Yahoo Finance, gold-api.com, SEC, World Bank CC BY 4.0).",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: ["This notice is governed by French law."],
        },
      ],
    },
  },
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      updated: UPDATED,
      sections: [
        {
          heading: "Responsable du traitement",
          paragraphs: [`KAH Digital Studio (Namake Keita, entreprise individuelle, SIREN 953 058 427). Contact : ${EMAIL}`],
        },
        {
          heading: "Données collectées et finalités",
          paragraphs: [
            "Compte : nom, adresse e-mail et mot de passe (stocké chiffré par le service d'authentification, jamais en clair) pour créer et sécuriser votre compte.",
            "Usage : vos alertes, votre liste de suivi et votre plan, pour faire fonctionner le service et vous envoyer les alertes que vous avez créées.",
            "E-mails : alertes que vous configurez et, pour les abonnés Pro, un résumé quotidien. Ce sont des messages de service liés à votre abonnement.",
            "Paiement : géré par Stripe. MineAlert ne reçoit ni ne conserve votre numéro de carte ; nous gardons l'identifiant client et d'abonnement Stripe.",
          ],
        },
        {
          heading: "Bases légales",
          paragraphs: [
            "Exécution du contrat (fournir le service demandé) ; intérêt légitime (sécurité, prévention des abus) ; obligation légale (conservation des justificatifs de facturation).",
          ],
        },
        {
          heading: "Destinataires et transferts",
          paragraphs: [
            "Vos données sont traitées par nos sous-traitants : Supabase (base de données, authentification), Vercel (hébergement), Resend (envoi d'e-mails), Stripe (paiement). Certains sont situés aux États-Unis ; les transferts s'appuient sur les clauses contractuelles types ou le cadre d'adéquation applicable.",
            "Nous ne vendons pas vos données et ne les utilisons pas pour de la publicité.",
          ],
        },
        {
          heading: "Durée de conservation",
          paragraphs: [
            "Les données du compte sont conservées tant que le compte existe et supprimées à votre demande. Les justificatifs de facturation sont conservés 10 ans (obligation comptable).",
          ],
        },
        {
          heading: "Vos droits",
          paragraphs: [
            `Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Écrivez à ${EMAIL} ; nous répondons sous un mois. Vous pouvez aussi saisir la CNIL (cnil.fr).`,
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "MineAlert n'utilise que des cookies techniques nécessaires à la connexion (session d'authentification). Aucun cookie publicitaire ni outil de mesure d'audience tiers n'est installé.",
          ],
        },
      ],
    },
    en: {
      title: "Privacy policy",
      updated: UPDATED,
      sections: [
        {
          heading: "Data controller",
          paragraphs: [`KAH Digital Studio (Namake Keita, sole proprietorship, SIREN 953 058 427). Contact: ${EMAIL}`],
        },
        {
          heading: "Data collected and purposes",
          paragraphs: [
            "Account: name, email address and password (stored hashed by the authentication service, never in clear text) to create and secure your account.",
            "Usage: your alerts, watchlist and plan, to run the service and send you the alerts you created.",
            "Emails: alerts you configure and, for Pro subscribers, a daily digest. These are service messages tied to your subscription.",
            "Payment: handled by Stripe. MineAlert never receives or stores your card number; we keep the Stripe customer and subscription identifiers.",
          ],
        },
        {
          heading: "Legal bases",
          paragraphs: [
            "Performance of a contract (providing the requested service); legitimate interest (security, abuse prevention); legal obligation (keeping billing records).",
          ],
        },
        {
          heading: "Recipients and transfers",
          paragraphs: [
            "Your data is processed by our subprocessors: Supabase (database, authentication), Vercel (hosting), Resend (email delivery), Stripe (payments). Some are based in the United States; transfers rely on standard contractual clauses or the applicable adequacy framework.",
            "We do not sell your data and do not use it for advertising.",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            "Account data is kept while your account exists and deleted on request. Billing records are kept for 10 years (accounting obligation).",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `You have the rights of access, rectification, erasure, restriction, objection and portability. Write to ${EMAIL}; we reply within one month. You may also lodge a complaint with the CNIL (cnil.fr) or your local data protection authority.`,
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "MineAlert only uses technical cookies required to sign in (authentication session). No advertising cookies or third-party analytics are installed.",
          ],
        },
      ],
    },
  },
  terms: {
    fr: {
      title: "Conditions d'utilisation et de vente",
      updated: UPDATED,
      sections: [
        {
          heading: "Objet",
          paragraphs: [
            "MineAlert est un service d'information sur les marchés miniers : cours indicatifs, dépôts réglementaires, indicateurs de risque pays et alertes par e-mail. Il est édité par KAH Digital Studio (voir mentions légales).",
          ],
        },
        {
          heading: "Pas de conseil en investissement",
          paragraphs: [
            "Les informations sont fournies à titre informatif. Elles ne constituent pas un conseil en investissement et ne tiennent pas compte de votre situation. Les cours sont indicatifs (contrats à terme COMEX/NYMEX/CME), peuvent être différés ou différer du prix spot, et provenir de sources tierces dont nous ne garantissons pas l'exactitude. Vous restez seul responsable de vos décisions. Pour un conseil personnalisé, adressez-vous à un conseiller en investissements financiers enregistré.",
          ],
        },
        {
          heading: "Comptes et plans",
          paragraphs: [
            "Le plan Gratuit comprend 5 alertes, les dépôts SEC, la fiche risque pays et les cours. Le plan Pro (9,99 € par mois ou 99 € par an, TVA non applicable, art. 293 B CGI) comprend 50 alertes et un résumé quotidien par e-mail.",
            "Le paiement est traité par Stripe. L'abonnement se renouvelle automatiquement à chaque échéance (mensuelle ou annuelle) jusqu'à résiliation.",
          ],
        },
        {
          heading: "Résiliation et rétractation",
          paragraphs: [
            "Vous pouvez résilier à tout moment depuis la page « Mon plan » (bouton « Gérer mon abonnement »). La résiliation arrête les renouvellements ; l'accès Pro reste ouvert jusqu'à la fin de la période payée.",
            `Si vous êtes consommateur, vous disposez de 14 jours à compter de la souscription pour vous rétracter sans motif : écrivez à ${EMAIL} et nous remboursons intégralement.`,
          ],
        },
        {
          heading: "Disponibilité et responsabilité",
          paragraphs: [
            "Nous faisons de notre mieux pour assurer un service continu et des données exactes, sans garantie d'absence d'interruption, de retard ou d'erreur des sources tierces. Dans la limite permise par la loi, notre responsabilité est limitée au montant payé sur les 12 derniers mois et exclut les pertes financières liées à vos décisions d'investissement.",
          ],
        },
        {
          heading: "Données personnelles",
          paragraphs: ["Voir la politique de confidentialité."],
        },
        {
          heading: "Droit applicable",
          paragraphs: [
            "Droit français. Les consommateurs conservent les droits impératifs de leur pays de résidence.",
          ],
        },
      ],
    },
    en: {
      title: "Terms of use and sale",
      updated: UPDATED,
      sections: [
        {
          heading: "Purpose",
          paragraphs: [
            "MineAlert is an information service about mining markets: indicative prices, regulatory filings, country risk indicators and email alerts. It is published by KAH Digital Studio (see legal notice).",
          ],
        },
        {
          heading: "No investment advice",
          paragraphs: [
            "The information is provided for information purposes only. It is not investment advice and does not take your situation into account. Prices are indicative (COMEX/NYMEX/CME futures), may be delayed or differ from the spot price, and come from third-party sources whose accuracy we do not guarantee. You remain solely responsible for your decisions. For personalised advice, consult a licensed investment adviser.",
          ],
        },
        {
          heading: "Accounts and plans",
          paragraphs: [
            "The Free plan includes 5 alerts, SEC filings, the country risk table and prices. The Pro plan (€9.99 per month or €99 per year, VAT not applicable, art. 293 B CGI) includes 50 alerts and a daily email digest.",
            "Payment is processed by Stripe. The subscription renews automatically at each term (monthly or yearly) until cancelled.",
          ],
        },
        {
          heading: "Cancellation and withdrawal",
          paragraphs: [
            "You can cancel at any time from the “My plan” page (“Manage my subscription” button). Cancelling stops renewals; Pro access remains until the end of the paid period.",
            `If you are a consumer, you have 14 days from subscribing to withdraw without giving a reason: write to ${EMAIL} and we will refund you in full.`,
          ],
        },
        {
          heading: "Availability and liability",
          paragraphs: [
            "We do our best to provide continuous service and accurate data, without guaranteeing the absence of interruptions, delays or errors from third-party sources. To the extent permitted by law, our liability is limited to the amount paid over the last 12 months and excludes financial losses resulting from your investment decisions.",
          ],
        },
        {
          heading: "Personal data",
          paragraphs: ["See the privacy policy."],
        },
        {
          heading: "Governing law",
          paragraphs: ["French law. Consumers keep the mandatory rights of their country of residence."],
        },
      ],
    },
  },
  contact: {
    fr: {
      title: "Contact",
      updated: UPDATED,
      sections: [
        {
          heading: "Nous écrire",
          paragraphs: [
            `Pour toute question sur MineAlert, votre abonnement ou vos données : ${EMAIL}. Nous répondons en général sous 2 jours ouvrés.`,
            "Pour résilier un abonnement Pro, utilisez le bouton « Gérer mon abonnement » dans votre compte (page « Mon plan »).",
            "Pour exercer vos droits sur vos données (accès, suppression…), écrivez-nous depuis l'adresse e-mail de votre compte.",
          ],
        },
        {
          heading: "Signaler une erreur de données",
          paragraphs: [
            "Si un cours, un dépôt ou un indicateur vous semble faux, écrivez-nous avec le minerai ou la société concernée et la page où vous l'avez vu : nous vérifions la source et corrigeons.",
          ],
        },
      ],
    },
    en: {
      title: "Contact",
      updated: UPDATED,
      sections: [
        {
          heading: "Write to us",
          paragraphs: [
            `For any question about MineAlert, your subscription or your data: ${EMAIL}. We usually reply within 2 business days.`,
            "To cancel a Pro subscription, use the “Manage my subscription” button in your account (“My plan” page).",
            "To exercise your data rights (access, deletion…), write to us from your account email address.",
          ],
        },
        {
          heading: "Report a data error",
          paragraphs: [
            "If a price, a filing or an indicator looks wrong, write to us with the mineral or company concerned and the page where you saw it: we check the source and correct it.",
          ],
        },
      ],
    },
  },
};
