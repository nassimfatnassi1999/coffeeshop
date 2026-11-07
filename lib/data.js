export const SEQUENCE = {
  frames: 150,
  path: (i) => `/sequence/frame_${String(i + 1).padStart(4, '0')}.webp`,
  /**
   * Position horizontale du sujet (0 = gauche, 1 = droite) pour chaque image.
   * Sert à bien recadrer la vidéo sur un écran vertical (mobile).
   * Plans : grains 1-39 · tassage 38-76 · extraction 74-112 · latte art 111-150
   */
  focus: (i) => (i < 38 ? 0.35 : i < 75 ? 0.3 : i < 111 ? 0.45 : 0.55),
};

export const CAPTIONS = [
  {
    at: [0.0, 0.22],
    side: 'left',
    kicker: '01 — Le grain',
    title: 'Sept grammes de patience.',
    text: 'Un espresso parfait commence bien avant la tasse : dans le choix du grain, torréfié en petites séries dans notre atelier.',
  },
  {
    at: [0.27, 0.48],
    side: 'right',
    kicker: '02 — La mouture',
    title: 'Moulu, dosé, tassé.',
    text: 'Moulu à la commande, pesé au dixième de gramme, puis tassé d’un geste régulier. Rien n’est laissé au hasard.',
  },
  {
    at: [0.52, 0.72],
    side: 'left',
    kicker: '03 — La crema',
    title: 'Une mousse couleur noisette.',
    text: "Le signe d'une extraction réussie : 9 bars, 93 °C, 25 secondes. Ni plus, ni moins.",
  },
  {
    at: [0.77, 1.0],
    side: 'right',
    kicker: '04 — Le rituel',
    title: 'Torréfié cette semaine.',
    text: 'Un lait soyeux, un latte art tracé à la main. Le café comme il devrait toujours être.',
  },
];

export const PRODUCTS = [
  {
    id: 'espresso',
    name: 'Espresso',
    price: 18,
    image: '/images/products/espresso.webp',
    alt: 'Espresso avec sa crema dans une tasse blanche, vu du dessus',
    text: 'Corsé, sirupeux, une crema dense aux notes de cacao et de noisette grillée.',
    specs: ['18 g', '36 ml', '27 s'],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    price: 28,
    image: '/images/products/cappuccino.webp',
    alt: 'Cappuccino saupoudré de cacao sur sa soucoupe',
    text: 'Un tiers espresso, un tiers lait, un tiers mousse. Saupoudré de cacao.',
    specs: ['Double shot', '180 ml', 'Lait entier'],
  },
  {
    id: 'latte',
    name: 'Latte',
    price: 32,
    image: '/images/products/latte.webp',
    alt: 'Latte avec un cœur en latte art dans une tasse brune',
    text: 'Velouté et doux, signé d’un latte art dessiné à la main par nos baristas.',
    specs: ['Double shot', '240 ml', 'Micro-mousse'],
  },
  {
    id: 'coldbrew',
    name: 'Cold Brew Crème',
    price: 35,
    image: '/images/products/coldbrew.webp',
    alt: 'Verre de cold brew avec glaçons et crème qui se mélange',
    text: 'Infusé à froid pendant 18 heures, adouci d’un nuage de crème.',
    specs: ['18 h', '350 ml', 'Glaçons'],
  },
];

export const ORIGINS = [
  {
    id: 'ethiopia',
    origin: 'Éthiopie',
    region: 'Yirgacheffe',
    image: '/images/origins/ethiopia.webp',
    photo: 'Café versé depuis une jebena, la cafetière traditionnelle éthiopienne',
    altitude: '1 950 m',
    process: 'Lavé',
    notes: ['Jasmin', 'Bergamote', 'Pêche blanche'],
    roast: 1,
    price: 145,
    color: '#b4532a',
  },
  {
    id: 'colombia',
    origin: 'Colombie',
    region: 'Huila',
    image: '/images/origins/colombia.webp',
    photo: 'Cerises de café mûres au coucher du soleil dans les montagnes de Colombie',
    altitude: '1 700 m',
    process: 'Honey',
    notes: ['Caramel', 'Pomme rouge', 'Cacao'],
    roast: 2,
    price: 129,
    color: '#2f4a3a',
  },
  {
    id: 'brazil',
    origin: 'Brésil',
    region: 'Cerrado Mineiro',
    image: '/images/origins/brazil.webp',
    photo: 'Plantation de café sur les collines du Brésil',
    altitude: '1 150 m',
    process: 'Nature',
    notes: ['Noisette', 'Chocolat noir', 'Miel'],
    roast: 3,
    price: 115,
    color: '#1f2a44',
  },
];

export const STEPS = [
  {
    n: '01',
    title: 'Sélection',
    text: 'Nous goûtons plus de 200 lots par an pour n’en garder qu’une dizaine, achetés directement aux fermes.',
  },
  {
    n: '02',
    title: 'Torréfaction',
    text: 'Des séries de 12 kg, profilées pour révéler le caractère de chaque origine — jamais pour le masquer.',
  },
  {
    n: '03',
    title: 'Repos',
    text: '48 heures de dégazage avant la mise en sachet. Le temps que les arômes se posent.',
  },
  {
    n: '04',
    title: 'Extraction',
    text: 'Mouture à la commande, eau filtrée à 93 °C, et un barista qui goûte chaque réglage du matin.',
  },
];

export const STATS = [
  { value: 12, suffix: '', label: 'origines en rotation' },
  { value: 48, suffix: 'h', label: 'de repos après torréfaction' },
  { value: 93, suffix: '°C', label: "température d'extraction" },
  { value: 25, suffix: 's', label: "pour un espresso parfait" },
];
