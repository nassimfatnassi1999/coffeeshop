# ☕ KAHWA — site café avec animations au scroll

Site vitrine d'un torréfacteur de café (marque fictive **KAHWA**), construit avec **Next.js (React)**,
**GSAP ScrollTrigger** pour les animations au scroll et **Lenis** pour le défilement fluide.

Tous les visuels sont de **vraies photos et vidéos** (Unsplash et Mixkit, libres de droits, usage
commercial autorisé) : tasse fumante, grains, tassage, extraction d'espresso, latte art, fermes de café.
Sources et licences : [CREDITS.md](CREDITS.md).

---

## 🚀 Lancer le projet

Pré-requis : **Node.js 20.9 ou plus récent** (testé avec Node 22).

```bash
npm install
npm run dev
```

Puis ouvrir <http://localhost:3000>.

Version de production :

```bash
npm run build
npm start
```

Déploiement : le projet se déploie tel quel sur **Vercel** (importer le dossier / le repo GitHub).

---

## ✨ Ce qu'il y a dans le site

| Section | Effet |
| --- | --- |
| **Loader** | Compteur 000 → 100 pendant le préchargement des 150 images de la séquence, puis ouverture en rideau |
| **Hero** | **Vraie vidéo** en boucle (tasse fumante au soleil), parallaxe à la souris. Au scroll, la caméra avance vers la tasse et le logo s'envole |
| **Expérience** | Animation "vidéo" pilotée par le scroll : 150 images tirées de vraies vidéos, dessinées dans un `<canvas>` (technique des pages produits Apple). Du grain à la tasse : grains versés dans le moulin → tassage → extraction de l'espresso → latte art. Légendes qui apparaissent au bon moment |
| **Bandeau** | Texte infini dont la vitesse et le sens suivent le scroll |
| **Menu** | Défilement **horizontal** épinglé, vraies photos des boissons, cartes avec inclinaison 3D au survol (pile verticale sur mobile) |
| **Origines** | Photos des pays d'origine (Éthiopie, Colombie, Brésil) avec parallaxe, bouton « Ajouter au panier » avec un grain qui vole jusqu'au panier |
| **Savoir-faire** | Vraie vidéo en boucle de grains de café qui tombent, en arrière-plan |
| **Chiffres** | Citation qui s'éclaire mot par mot au scroll + compteurs animés |
| **Contact** | Newsletter, infos pratiques, grand logo qui se révèle lettre par lettre |

Bonus : curseur personnalisé (desktop), grain "pellicule" sur toute la page, navigation qui se cache
en descendant et change de couleur sur la section claire, responsive mobile.

---

## 📁 Structure

```
app/
  layout.js            # polices, métadonnées, CSS global
  page.js              # assemble toutes les sections
  globals.css          # tout le style (couleurs dans :root)
  icon.svg             # favicon
components/
  SmoothScroll.jsx     # Lenis + synchronisation GSAP
  Loader.jsx           # écran de chargement
  Nav.jsx, Cursor.jsx
  Hero.jsx             # section hero (vidéo + texte + scroll)
  ScrollSequence.jsx   # animation d'images pilotée par le scroll
  Marquee.jsx, Menu.jsx, Origins.jsx, Process.jsx, Stats.jsx, Footer.jsx
lib/
  data.js              # textes, produits, prix, origines → à modifier facilement
  store.js             # petit état partagé (Lenis, chargement, panier)
public/
  sequence/            # 150 images .webp de l'animation au scroll (tirées de vraies vidéos)
  video/               # hero-loop (tasse fumante) + beans-loop (grains) : mp4 + webm + poster
  images/products/     # photos des boissons
  images/origins/      # photos des pays d'origine
  og.jpg               # image de partage réseaux sociaux
scripts/
  prepare-media.sh     # télécharge les photos/vidéos (Unsplash, Mixkit) et prépare public/ avec ffmpeg
CREDITS.md             # sources et licences de chaque photo / vidéo
```

---

## 🎨 Personnaliser

- **Textes, prix, produits** : `lib/data.js`
- **Couleurs et polices** : variables en haut de `app/globals.css`
- **Photos et vidéos** : remplace simplement les fichiers dans `public/` (mêmes noms), ou change les
  sources dans `scripts/prepare-media.sh`
- **Durée des animations au scroll** : `end: '+=380%'` dans `ScrollSequence.jsx`, `end: '+=110%'` dans `Hero.jsx`

### Changer ou régénérer les photos et vidéos

Les fichiers prêts à l'emploi sont déjà dans `public/`. Pour les refaire (ou en choisir d'autres) :

```bash
npm run media             # tout refaire (~2 min, télécharge ~250 Mo de vidéos sources)
npm run media -- photos   # une seule partie : hero | sequence | process | photos
```

Il faut **curl** et **ffmpeg** installés (Windows : utiliser Git Bash ou WSL).

- Une **photo Unsplash** se choisit par son identifiant (`photo-XXXX` dans l'adresse de l'image) et un point
  focal pour le recadrage.
- Une **vidéo Mixkit** se choisit par son numéro (à la fin de l'adresse, ex. `.../steaming-mug-808/` → `808`).
- Si tu changes le nombre d'images de la séquence, mets à jour `SEQUENCE.frames` dans `lib/data.js`.
- Pense à mettre à jour `CREDITS.md`.

---

## 🧠 Comment marche l'animation "vidéo" au scroll ?

1. Un script découpe 4 vraies vidéos et les enchaîne en fondu, image par image (150 images) → `public/sequence/`.
2. Le site précharge ces images.
3. GSAP ScrollTrigger "épingle" la section et transforme la position du scroll en numéro d'image (0 → 149).
4. À chaque changement, l'image correspondante est dessinée dans un `<canvas>`.

Résultat : une animation fluide qui avance et recule avec le scroll, comme une vidéo qu'on "scrube".

---

## 📦 Technologies

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [GSAP](https://gsap.com) (ScrollTrigger, SplitText)
- [Lenis](https://lenis.darkroom.engineering) (smooth scroll)
- Polices : Fraunces + Manrope (via Fontsource, chargées localement)

Photos : [Unsplash](https://unsplash.com) · Vidéos : [Mixkit](https://mixkit.co) — détails dans [CREDITS.md](CREDITS.md).

Projet de démonstration — marque, adresse et prix fictifs.
