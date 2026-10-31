/*
 * Centre de formation ELMES-TEKA : un parcours par fonctionnalité.
 * Les captures (public/guide/shots) viennent de la plateforme réelle, compte de démonstration.
 * Les vidéos (public/guide/videos) sont enregistrées automatiquement : scripts/guide-capture.
 */

export type GuideRole = "Gestionnaire" | "Vendeur" | "Gestionnaire et vendeur";

export interface GuideStep {
  title: string;
  text: string;
  /** Identifiant de capture : public/guide/shots/{shot}.jpg */
  shot?: string;
  tip?: string;
}

export interface GuideTopic {
  slug: string;
  title: string;
  role: GuideRole;
  category: "Démarrer" | "Vendre" | "Gérer" | "Finances" | "Croissance";
  summary: string;
  benefit: string;
  duration: string;
  where: string;
  prerequisites: string[];
  /** Vidéo : public/guide/videos/{video}.mp4 */
  video?: string;
  steps: GuideStep[];
  faq: Array<{ q: string; a: string }>;
  related: string[];
}

export const GUIDE_PATH: Array<{ slug: string; label: string }> = [
  { slug: "creer-son-compte", label: "Créer son compte" },
  { slug: "exercice-et-abonnement", label: "Ouvrir l'exercice" },
  { slug: "points-de-vente", label: "Créer ses boutiques" },
  { slug: "articles", label: "Ajouter ses articles" },
  { slug: "agents", label: "Inviter ses vendeurs" },
  { slug: "ventes", label: "Vendre" },
];

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    slug: "creer-son-compte",
    title: "Créer son compte entrepreneur",
    role: "Gestionnaire",
    category: "Démarrer",
    summary: "Inscrivez votre entreprise en 3 étapes, sans technicien.",
    benefit: "Un seul compte pour toutes vos boutiques, vos vendeurs et vos chiffres.",
    duration: "5 min",
    where: "Site ELMES-TEKA › Commencer",
    prerequisites: ["Une adresse e-mail et un numéro de téléphone", "Le nom de votre entreprise ou de votre activité"],
    steps: [
      {
        title: "Identité du responsable",
        text: "Cliquez sur « Commencer ». Saisissez votre pseudo, votre téléphone et votre e-mail. Ils servent à vous connecter et à vous joindre.",
        shot: "public-signup",
        tip: "Vous avez reçu un lien de parrainage ou un code promo ? Ouvrez le lien : le code est déjà rempli à la dernière étape.",
      },
      {
        title: "Votre entreprise",
        text: "Indiquez le nom commercial, le type (entreprise ou entrepreneur individuel) et une courte présentation. Ajoutez votre logo et vos documents (RCCM, ID nationale) si vous les avez.",
      },
      {
        title: "Sécurité et code",
        text: "Choisissez un mot de passe (8 caractères, une majuscule, une minuscule, un chiffre). Saisissez votre code de parrainage ou code promo s'il y en a un, puis « Créer le compte ».",
        tip: "Un code de parrainage vous donne 10 % de réduction sur votre premier abonnement.",
      },
      {
        title: "Votre tableau de bord",
        text: "Vous arrivez sur votre tableau de bord. Il est vide tant que vous n'avez pas ouvert d'exercice ni créé de boutique : c'est l'étape suivante.",
        shot: "tenant-dashboard",
      },
    ],
    faq: [
      { q: "Mes vendeurs doivent-ils aussi s'inscrire ?", a: "Non. Vous créez vous-même leurs comptes depuis le menu Agents. Cette inscription est réservée au gestionnaire." },
      { q: "Je n'ai pas de RCCM, puis-je m'inscrire ?", a: "Oui. ELMES-TEKA est fait pour les activités formelles comme informelles. Les documents sont facultatifs." },
    ],
    related: ["exercice-et-abonnement", "parrainage-et-codes-promo"],
  },
  {
    slug: "exercice-et-abonnement",
    title: "Ouvrir un exercice et payer l'abonnement",
    role: "Gestionnaire",
    category: "Démarrer",
    summary: "L'exercice est votre année de gestion. Il s'active dès le paiement Mobile Money.",
    benefit: "Toutes vos ventes, dépenses et opérations sont rangées par année : vos bilans se font tout seuls.",
    duration: "3 min",
    where: "Menu du profil (en haut à droite) › Exercices",
    prerequisites: ["Un compte gestionnaire", "Un téléphone Mobile Money (M-Pesa, Orange Money, Airtel Money, Afrimoney)"],
    video: "exercice",
    steps: [
      {
        title: "Ouvrir la page Exercices",
        text: "Cliquez sur votre nom en haut à droite, puis sur Exercices. Vous y voyez chaque année, son statut (En attente, Actif, Clôturé) et ses résultats.",
        shot: "tenant-annees",
      },
      {
        title: "Créer l'exercice",
        text: "Cliquez sur « Nouvel exercice ». Choisissez l'année (l'exercice va toujours du 1er janvier au 31 décembre), votre pack, la devise de paiement et votre numéro Mobile Money. Saisissez un code promo si vous en avez un : le prix réduit s'affiche immédiatement.",
        shot: "tenant-annees-create",
        tip: "Choisissez Starter à 50 USD, Business à 120 USD ou Premium à 200 USD par exercice (ou l'équivalent en CDF). Le parrainage et les codes promo réduisent le tarif. L'upgrade est calculé au prorata du temps restant.",
      },
      {
        title: "Valider sur votre téléphone",
        text: "Cliquez sur « Créer et payer ». Votre téléphone reçoit une demande de paiement : saisissez votre code secret Mobile Money pour confirmer.",
      },
      {
        title: "L'exercice s'active tout seul",
        text: "Dès que FlexPay confirme le paiement, l'exercice passe en « Actif » automatiquement. Si rien ne bouge, utilisez « Vérifier le paiement ». En cas d'échec, « Relancer le paiement » renvoie une demande.",
        tip: "Un code promo à 100 % active l'exercice immédiatement, sans paiement.",
      },
    ],
    faq: [
      { q: "Puis-je avoir deux exercices pour la même année ?", a: "Non, un seul par année calendaire. Si un paiement a échoué, relancez-le depuis la carte de l'exercice au lieu d'en créer un autre." },
      { q: "Que se passe-t-il à la fin de l'année ?", a: "Vous clôturez l'exercice (voir « Comptabilité et clôture ») et vous ouvrez le suivant. L'historique reste consultable." },
    ],
    related: ["points-de-vente", "comptabilite-et-cloture"],
  },
  {
    slug: "points-de-vente",
    title: "Créer et gérer ses points de vente",
    role: "Gestionnaire",
    category: "Démarrer",
    summary: "Chaque boutique, dépôt ou agence a sa propre fiche, ses vendeurs, ses articles et son stock.",
    benefit: "Vous comparez vos boutiques et vous savez ce qui se passe dans chacune, même à distance.",
    duration: "5 min par boutique",
    where: "Menu › Points de ventes",
    prerequisites: ["Un exercice actif"],
    video: "points-de-vente",
    steps: [
      {
        title: "La liste de vos points de vente",
        text: "Chaque carte affiche la boutique, son statut et ses actions : Voir, Modifier, Associer produits, Gérer les capitaux, Archiver.",
        shot: "tenant-stores",
      },
      {
        title: "Créer une boutique",
        text: "Cliquez sur « Nouveau point de vente » et renseignez la désignation, une description et l'adresse.",
        shot: "tenant-stores-create",
      },
      {
        title: "Associer les articles vendus",
        text: "« Associer produits » : choisissez l'exercice puis les articles que cette boutique vend. Ils apparaîtront dans la caisse des vendeurs de cette boutique.",
        shot: "tenant-stores-products",
      },
      {
        title: "Déclarer le capital de départ",
        text: "« Gérer les capitaux » : enregistrez l'argent investi dans la boutique pour l'exercice. Il sert au calcul de la rentabilité.",
        shot: "tenant-stores-capital",
      },
      {
        title: "Suivre la boutique",
        text: "« Voir » ouvre la fiche : vendeurs affectés, articles et quantités en stock, chiffre d'affaires et résultat.",
        shot: "tenant-stores-detail",
      },
    ],
    faq: [
      { q: "Un article doit-il être associé à chaque boutique ?", a: "Oui : le catalogue est commun, mais chaque boutique choisit ce qu'elle vend et a son propre stock." },
      { q: "Puis-je retirer un article d'une boutique ?", a: "Oui, une fois sa quantité ramenée à zéro, pour ne pas perdre la trace du stock." },
    ],
    related: ["articles", "agents", "stocks"],
  },
  {
    slug: "articles",
    title: "Créer son catalogue d'articles",
    role: "Gestionnaire",
    category: "Démarrer",
    summary: "Produits et services avec leurs prix en USD et/ou en CDF.",
    benefit: "Des prix fixés par vous : le vendeur ne peut pas les modifier à la caisse.",
    duration: "1 min par article",
    where: "Menu › Articles",
    prerequisites: [],
    video: "article",
    steps: [
      {
        title: "Votre catalogue",
        text: "Retrouvez tous vos articles, leur catégorie et leurs prix. Le bouton « Ventes » d'un article exporte son historique de ventes.",
        shot: "tenant-products",
      },
      {
        title: "Ajouter un article",
        text: "« Nouveau produit » : désignation, catégorie, un ou plusieurs prix (montant et devise), une description. Ajoutez une photo pour le reconnaître facilement.",
        shot: "tenant-products-create",
        tip: "Donnez un prix en USD et un en CDF si vos clients paient dans les deux monnaies.",
      },
      {
        title: "Le rendre disponible en boutique",
        text: "Associez l'article aux boutiques qui le vendent (Points de ventes › Associer produits) puis approvisionnez le stock.",
      },
    ],
    faq: [
      { q: "Supprimer ou archiver ?", a: "Archivez un article qui a déjà été vendu : il disparaît de la caisse mais son historique reste dans vos chiffres." },
    ],
    related: ["points-de-vente", "stocks"],
  },
  {
    slug: "agents",
    title: "Ajouter ses vendeurs (agents)",
    role: "Gestionnaire",
    category: "Démarrer",
    summary: "Créez un compte par vendeur et affectez-le à une boutique.",
    benefit: "Chaque vente est signée par son vendeur : vous savez qui a vendu quoi.",
    duration: "2 min par vendeur",
    where: "Menu › Agents",
    prerequisites: ["Au moins un point de vente"],
    video: "agents",
    steps: [
      {
        title: "Vos agents",
        text: "La liste montre chaque vendeur, sa boutique et son statut. Vous pouvez le voir, le modifier, le retirer d'une boutique ou le suspendre.",
        shot: "tenant-agents",
      },
      {
        title: "Créer le compte du vendeur",
        text: "« Nouvel agent » : recherchez un utilisateur existant ou créez un compte (pseudo, téléphone, e-mail, mot de passe). Communiquez ces accès au vendeur.",
        shot: "tenant-agents-create",
      },
      {
        title: "L'affecter à une boutique",
        text: "Un vendeur travaille dans une seule boutique à la fois. Il ne voit et ne vend que dans cette boutique.",
        tip: "Suspendez un vendeur qui quitte l'entreprise : il ne peut plus se connecter, son historique reste intact.",
      },
    ],
    faq: [
      { q: "Le vendeur voit-il les chiffres des autres boutiques ?", a: "Non. Il n'a accès qu'à sa boutique et aux exercices actifs." },
    ],
    related: ["ventes", "points-de-vente"],
  },
  {
    slug: "ventes",
    title: "Enregistrer une vente et remettre la facture",
    role: "Vendeur",
    category: "Vendre",
    summary: "La caisse du vendeur : articles, client, réduction, facture.",
    benefit: "Chaque vente met le stock à jour et apparaît en temps réel chez le gestionnaire.",
    duration: "30 secondes par vente",
    where: "Espace vendeur › Ventes › année en cours",
    prerequisites: ["Un compte vendeur affecté à une boutique", "Des articles en stock"],
    video: "vente",
    steps: [
      {
        title: "L'écran des ventes",
        text: "En haut : nombre de transactions, ventes annulées, chiffre d'affaires et panier moyen, en USD ou en CDF. En dessous : chaque vente avec son statut, son client et son montant.",
        shot: "saler-ventes",
      },
      {
        title: "Nouvelle vente",
        text: "Cliquez sur « Nouvelle vente ». Recherchez les articles par nom ou code, ajustez les quantités. Le stock disponible est vérifié automatiquement.",
        shot: "saler-ventes-create",
      },
      {
        title: "Identifier le client",
        text: "Recherchez le client par nom, téléphone ou e-mail, ou créez-le en quelques secondes. Si le client a droit à une promotion, la meilleure réduction s'applique toute seule.",
        tip: "Identifier le client permet de le fidéliser : historique d'achats, promotions, SMS.",
      },
      {
        title: "Valider et remettre la facture",
        text: "« Valider la vente » enregistre la vente et retire les articles du stock. Le bouton « Facture » de la vente génère une facture à imprimer ou partager.",
      },
    ],
    faq: [
      { q: "Je me suis trompé, que faire ?", a: "« Annuler » sur la vente : les articles reviennent dans le stock et la vente reste visible comme annulée. Le gestionnaire voit toutes les annulations." },
      { q: "Le gestionnaire est-il prévenu ?", a: "Oui, chaque vente apparaît en temps réel sur son tableau de bord." },
    ],
    related: ["depenses", "stocks", "clients-et-promotions"],
  },
  {
    slug: "depenses",
    title: "Déclarer et valider une dépense",
    role: "Gestionnaire et vendeur",
    category: "Vendre",
    summary: "Le vendeur déclare, le gestionnaire valide.",
    benefit: "Plus de sorties de caisse sans justification.",
    duration: "1 min",
    where: "Espace vendeur › Dépenses · Gestionnaire : cloche de notifications",
    prerequisites: ["Un exercice actif"],
    video: "depense",
    steps: [
      {
        title: "Les dépenses de la boutique",
        text: "Le vendeur retrouve toutes les dépenses de sa boutique et leur statut.",
        shot: "saler-depenses",
      },
      {
        title: "Déclarer une dépense",
        text: "« Nouvelle dépense » : choisissez la devise, puis ajoutez une ligne par dépense (libellé, montant, observation). Exemple : transport, fournitures, électricité.",
        shot: "saler-depenses-create",
      },
      {
        title: "Validation par le gestionnaire",
        text: "Le gestionnaire reçoit la demande dans la cloche de notifications (en haut) et l'approuve ou la refuse. Seules les dépenses validées comptent dans les résultats.",
        shot: "tenant-notifications",
      },
    ],
    faq: [{ q: "Le vendeur peut-il annuler sa dépense ?", a: "Oui, tant qu'elle n'est pas validée." }],
    related: ["ventes", "tresorerie"],
  },
  {
    slug: "stocks",
    title: "Approvisionner et suivre les stocks",
    role: "Gestionnaire et vendeur",
    category: "Gérer",
    summary: "Demandes d'approvisionnement, validation et vue consolidée.",
    benefit: "Vous voyez le stock de chaque boutique et les ruptures avant qu'elles arrivent.",
    duration: "2 min",
    where: "Gestionnaire : Menu › Stock · Vendeur : Stocks › année",
    prerequisites: ["Des articles associés à la boutique"],
    video: "stock",
    steps: [
      {
        title: "Vue d'ensemble (gestionnaire)",
        text: "Toutes les boutiques, tous les articles : quantité, prix unitaire, valeur totale et statut (critique, à surveiller, normal).",
        shot: "tenant-stocks",
      },
      {
        title: "Demande d'approvisionnement (vendeur)",
        text: "Le vendeur liste ses demandes et en crée une nouvelle : articles, quantités et motif.",
        shot: "saler-stocks",
      },
      {
        title: "Saisir la demande",
        text: "Sélectionnez les articles et les quantités reçues ou souhaitées. Le stock ne change qu'après validation du gestionnaire.",
        shot: "saler-stocks-create",
      },
      {
        title: "Validation",
        text: "Le gestionnaire approuve la demande depuis la cloche de notifications : le stock de la boutique est mis à jour immédiatement.",
        shot: "tenant-notifications",
      },
    ],
    faq: [{ q: "Pourquoi une validation ?", a: "Pour que personne ne puisse gonfler ou vider un stock sans contrôle : c'est la première protection contre les pertes." }],
    related: ["ventes", "points-de-vente"],
  },
  {
    slug: "clients-et-promotions",
    title: "Fidéliser : clients, promotions et SMS",
    role: "Gestionnaire",
    category: "Croissance",
    summary: "Récompensez vos meilleurs clients et prévenez-les par SMS.",
    benefit: "Des clients qui reviennent, et des promotions qui ciblent les bonnes personnes.",
    duration: "5 min",
    where: "Menu › Clients",
    prerequisites: ["Des ventes rattachées à des clients"],
    steps: [
      {
        title: "Vos clients",
        text: "Le tableau récapitule vos clients, ceux qui achètent, les inactifs, le nombre de commandes et le chiffre d'affaires cumulé, avec vos promotions.",
        shot: "tenant-clients",
      },
      {
        title: "Créer une promotion",
        text: "« Nouvelle promotion » : désignation, code, réduction en % et nombre minimum d'articles achetés pour y avoir droit.",
        shot: "tenant-clients-promo",
      },
      {
        title: "Diffuser par SMS",
        text: "Ouvrez la promotion : sélectionnez les clients éligibles et envoyez un message personnalisé ({{name}}, {{code}}, {{reduction}}). Chaque SMS consomme un crédit.",
        shot: "tenant-clients-audience",
        tip: "Les crédits SMS s'achètent par 30 (2 USD) en Mobile Money, depuis la page de la promotion.",
      },
    ],
    faq: [{ q: "La réduction s'applique-t-elle seule ?", a: "Oui. À la caisse, dès que le vendeur identifie un client éligible, la meilleure promotion est appliquée." }],
    related: ["ventes", "parrainage-et-codes-promo"],
  },
  {
    slug: "tresorerie",
    title: "Trésorerie : liquidités, créances, dettes et fonds",
    role: "Gestionnaire et vendeur",
    category: "Finances",
    summary: "Tout l'argent qui entre, qui sort, qu'on vous doit et que vous devez.",
    benefit: "Une caisse transparente et des échéances qui ne s'oublient plus.",
    duration: "1 min par opération",
    where: "Menu › Liquidités, Créances, Dettes, Fonds",
    prerequisites: ["Un exercice actif"],
    steps: [
      {
        title: "Liquidités",
        text: "Les entrées et sorties d'argent hors ventes (dépôt bancaire, retrait, transfert). « Ajouter » : libellé, type, devise, montant et date.",
        shot: "tenant-liquidites",
      },
      {
        title: "Créances clients",
        text: "Ce que vos clients vous doivent, avec l'échéance. Cliquez sur « Recouvrée » quand le client a payé.",
        shot: "tenant-creances",
      },
      {
        title: "Dettes fournisseurs",
        text: "Ce que vous devez à vos fournisseurs, avec l'échéance. Cliquez sur « Remboursée » une fois payé.",
        shot: "tenant-dettes",
      },
      {
        title: "Fonds propres",
        text: "Les apports et retraits personnels du propriétaire. Ils sont séparés des ventes pour ne pas fausser la rentabilité.",
        shot: "tenant-fonds",
      },
    ],
    faq: [{ q: "Pourquoi séparer les fonds propres ?", a: "Pour qu'un apport personnel ne soit pas compté comme une vente, ni un retrait comme une perte : vos résultats restent fidèles." }],
    related: ["comptabilite-et-cloture", "immobilisations"],
  },
  {
    slug: "immobilisations",
    title: "Suivre ses immobilisations",
    role: "Gestionnaire",
    category: "Finances",
    summary: "Le matériel durable de l'entreprise : véhicules, congélateurs, ordinateurs…",
    benefit: "Vous connaissez la valeur de ce que vous possédez, un atout pour un dossier de crédit.",
    duration: "1 min par bien",
    where: "Menu › Immobilisations",
    prerequisites: [],
    steps: [
      { title: "Vos immobilisations", text: "La liste de vos biens durables, leur catégorie, leur valeur et leur statut.", shot: "tenant-immobilisations" },
      { title: "Ajouter un bien", text: "« Ajouter » : désignation, catégorie, valeur d'achat, durée de vie en années et date d'acquisition.", shot: "tenant-immobilisations-create" },
    ],
    faq: [{ q: "À quoi sert la durée de vie ?", a: "À estimer l'usure du bien au fil des années (amortissement)." }],
    related: ["tresorerie", "comptabilite-et-cloture"],
  },
  {
    slug: "tableau-de-bord",
    title: "Superviser en temps réel",
    role: "Gestionnaire",
    category: "Gérer",
    summary: "Toutes vos boutiques sur un seul écran, même depuis votre téléphone.",
    benefit: "Savoir ce qui se vend, par qui et quand, sans être sur place.",
    duration: "Au quotidien",
    where: "Menu › Dashboard",
    prerequisites: [],
    video: "supervision",
    steps: [
      {
        title: "Les chiffres du jour",
        text: "Chiffre d'affaires, dépenses, résultat net et nombre de ventes du jour. Les alertes signalent les commandes en attente et les demandes à valider.",
        shot: "tenant-dashboard",
      },
      {
        title: "Les notifications",
        text: "La cloche regroupe les demandes d'approvisionnement et les dépenses à valider. Approuvez ou refusez en un clic.",
        shot: "tenant-notifications",
      },
      {
        title: "Ce qui se passe sans recharger",
        text: "Chaque vente validée en boutique met à jour votre tableau de bord automatiquement : supervision par boutique, ventes, vendeurs actifs.",
      },
    ],
    faq: [{ q: "Mes vendeurs ont-ils ce tableau de bord ?", a: "Ils ont un espace de travail limité à leur boutique." }],
    related: ["stocks", "comptabilite-et-cloture"],
  },
  {
    slug: "comptabilite-et-cloture",
    title: "Journal, dossier de financement et clôture",
    role: "Gestionnaire",
    category: "Finances",
    summary: "L'historique complet, exportable pour votre banque ou votre microfinance.",
    benefit: "Chaque opération enregistrée construit votre dossier de crédit.",
    duration: "5 min",
    where: "Menu › Journal, Clôture",
    prerequisites: ["Un exercice avec des opérations"],
    steps: [
      {
        title: "Le journal",
        text: "Toutes les opérations au même endroit : ventes, dépenses, liquidités, créances, fonds et dettes, filtrables par type et par boutique.",
        shot: "tenant-journal",
      },
      {
        title: "Le dossier de financement (PDF)",
        text: "« Dossier PDF » génère un état financier de l'exercice, à vérifier avant de le remettre à une banque ou une institution de microfinance. Les exports avancés sont réservés aux packs Business et Premium ; l’export Excel du journal se trouve sur la page Exercices.",
      },
      {
        title: "La clôture d'exercice",
        text: "En fin d'année, la page Clôture vous guide : inventaire des stocks à valider, puis clôture. L'exercice passe en « Clôturé » et vous ouvrez le suivant.",
        shot: "tenant-cloture",
      },
    ],
    faq: [{ q: "Puis-je encore consulter un exercice clôturé ?", a: "Oui, l’historique reste consultable. Les exports avancés nécessitent un pack Business ou Premium actif." }],
    related: ["tresorerie", "exercice-et-abonnement"],
  },
  {
    slug: "parrainage-et-codes-promo",
    title: "Parrainage et codes promo",
    role: "Gestionnaire",
    category: "Croissance",
    summary: "Invitez d'autres entrepreneurs et payez moins cher votre abonnement.",
    benefit: "Vos filleuls ont -10 % ; vous gagnez +5 % tous les 5 filleuls qui paient (jusqu'à 50 %).",
    duration: "1 min",
    where: "Menu › Dashboard › Parrainez, payez moins",
    prerequisites: ["Un compte gestionnaire"],
    steps: [
      {
        title: "Votre code de parrainage",
        text: "Sur le tableau de bord, la carte « Parrainez, payez moins » affiche votre code, vos filleuls inscrits et payants, et votre bonus actuel.",
        shot: "tenant-referral",
      },
      {
        title: "Partager",
        text: "« Partager sur WhatsApp » prépare le message avec votre lien. « Partager » ouvre le partage du téléphone (SMS, Facebook…). « Copier » copie le message.",
      },
      {
        title: "Les codes promo",
        text: "Lors d'événements, ELMES publie des codes promo sur le site. Saisissez-les à l'inscription ou à la création de l'exercice. Une seule réduction s'applique : la plus avantageuse.",
      },
    ],
    faq: [
      { q: "Quand un filleul compte-t-il ?", a: "Quand il a payé son premier abonnement. Les inscriptions seules ne comptent pas." },
      { q: "Mon bonus est-il valable chaque année ?", a: "Oui, tant que vos filleuls payants restent au même palier." },
    ],
    related: ["exercice-et-abonnement", "clients-et-promotions"],
  },
];

export const GUIDE_CATEGORIES = ["Démarrer", "Vendre", "Gérer", "Finances", "Croissance"] as const;

export function getTopic(slug: string): GuideTopic | undefined {
  return GUIDE_TOPICS.find((topic) => topic.slug === slug);
}
