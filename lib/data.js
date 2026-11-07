export const SEQUENCE = {
  frames: 150,
  path: (i) => `/sequence/frame_${String(i + 1).padStart(4, '0')}.webp`,
};

export const CAPTIONS = [
  {
    at: [0.0, 0.2],
    side: 'left',
    kicker: "01 — L'essence",
    title: 'Sept grammes de patience.',
    text: 'Un espresso parfait commence bien avant la tasse : dans le choix du grain, la mouture, la pression.',
  },
  {
    at: [0.24, 0.46],
    side: 'right',
    kicker: '02 — Déconstruit',
    title: 'Chaque tasse cache une histoire.',
    text: 'Des centaines de grains triés à la main, torréfiés en petites séries dans notre atelier.',
  },
  {
    at: [0.5, 0.72],
    side: 'left',
    kicker: '03 — La crema',
    title: "Une mousse couleur noisette.",
    text: "Le signe d'une extraction réussie : 9 bars, 93 °C, 25 secondes. Ni plus, ni moins.",
  },
  {
    at: [0.78, 1.0],
    side: 'right',
    kicker: '04 — Le rituel',
    title: 'Torréfié cette semaine.',
    text: 'Moulu à la commande, servi avec soin. Le café comme il devrait toujours être.',
  },
];

export const PRODUCTS = [
  {
    id: 'espresso',
    name: 'Espresso',
    price: 18,
    image: '/images/products/espresso.webp',
    text: 'Corsé, sirupeux, une crema dense aux notes de cacao et de noisette grillée.',
    specs: ['18 g', '36 ml', '27 s'],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    price: 28,
    image: '/images/products/cappuccino.webp',
    text: 'Un tiers espresso, un tiers lait, un tiers mousse. Saupoudré de cacao.',
    specs: ['Double shot', '180 ml', 'Lait entier'],
  },
  {
    id: 'latte',
    name: 'Latte',
    price: 32,
    image: '/images/products/latte.webp',
    text: 'Velouté et doux, signé d’un latte art tulipe par nos baristas.',
    specs: ['Double shot', '240 ml', 'Micro-mousse'],
  },
  {
    id: 'coldbrew',
    name: 'Cold Brew Crème',
    price: 35,
    image: '/images/products/coldbrew.webp',
    text: 'Infusé à froid pendant 18 heures, adouci d’un nuage de crème.',
    specs: ['18 h', '350 ml', 'Glaçons'],
  },
];

export const ORIGINS = [
  {
    id: 'ethiopia',
    origin: 'Éthiopie',
    region: 'Yirgacheffe',
    image: '/images/bags/ethiopia.webp',
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
    image: '/images/bags/colombia.webp',
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
    image: '/images/bags/brazil.webp',
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
