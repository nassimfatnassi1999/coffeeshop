# ☕ KAHWA — site café 3D avec animations au scroll

Site vitrine d'un torréfacteur de café (marque fictive **KAHWA**), construit avec **Next.js (React)**,
**Three.js / React Three Fiber** pour la 3D, **GSAP ScrollTrigger** pour les animations au scroll et
**Lenis** pour le défilement fluide.

Tous les visuels (tasses, grains, sachets, vidéo, séquence d'images) sont **générés par code**, à partir
de modèles 3D procéduraux. Aucune image externe ni banque d'images.

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
| **Hero** | Scène 3D **temps réel** (React Three Fiber) : tasse de latte avec latte art, vapeur animée (shader GLSL), grains flottants, parallaxe à la souris. Au scroll, la tasse tourne, montre le latte art puis s'envole |
| **Expérience** | Animation "vidéo" pilotée par le scroll : 150 images 3D dessinées dans un `<canvas>` (technique des pages produits Apple). La tasse se décompose en "vue éclatée" et des centaines de grains tourbillonnent. Légendes qui apparaissent au bon moment |
| **Bandeau** | Texte infini dont la vitesse et le sens suivent le scroll |
| **Menu** | Défilement **horizontal** épinglé, cartes avec inclinaison 3D au survol (pile verticale sur mobile) |
| **Origines** | Sachets de café avec parallaxe, bouton « Ajouter au panier » avec un grain qui vole jusqu'au panier |
| **Savoir-faire** | Vidéo en boucle de grains qui tombent (avec flou de profondeur) en arrière-plan |
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
  Hero.jsx             # section hero (texte + scroll)
  HeroScene.jsx        # scène 3D temps réel (React Three Fiber)
  ScrollSequence.jsx   # animation d'images pilotée par le scroll
  Marquee.jsx, Menu.jsx, Origins.jsx, Process.jsx, Stats.jsx, Footer.jsx
lib/
  three/models.js      # ⭐ modèles 3D procéduraux (tasse, soucoupe, grain, verre, sachet)
  data.js              # textes, produits, prix, origines → à modifier facilement
  store.js             # petit état partagé (scroll, souris, panier)
public/
  sequence/            # 150 images .webp de l'animation au scroll
  video/               # vidéo en boucle (mp4 + webm + poster)
  images/products/     # visuels des boissons
  images/bags/         # visuels des sachets
  og.jpg               # image de partage réseaux sociaux
scripts/
  render-assets.mjs    # régénère TOUS les visuels à partir des modèles 3D
  render/              # scènes de rendu hors-ligne (Three.js dans Chromium)
```

---

## 🎨 Personnaliser

- **Textes, prix, produits** : `lib/data.js`
- **Couleurs et polices** : variables en haut de `app/globals.css`
- **Forme de la tasse, couleur des grains, latte art** : `lib/three/models.js`
- **Durée des animations au scroll** : `end: '+=380%'` dans `ScrollSequence.jsx`, `end: '+=110%'` dans `Hero.jsx`

### Régénérer les images et la vidéo

Si tu modifies les modèles 3D (`lib/three/models.js`) ou les scènes (`scripts/render/scenes.js`) :

```bash
npx playwright install chromium   # une seule fois
npm run render:assets             # tout régénérer (~5 min)
```

Il faut aussi **ffmpeg** installé pour encoder la vidéo. Tu peux régénérer un seul élément :

```bash
node scripts/render-assets.mjs product:latte
node scripts/render-assets.mjs sequence
```

---

## 🧠 Comment marche l'animation "vidéo" au scroll ?

1. Un script rend la scène 3D image par image (150 images) → `public/sequence/`.
2. Le site précharge ces images.
3. GSAP ScrollTrigger "épingle" la section et transforme la position du scroll en numéro d'image (0 → 149).
4. À chaque changement, l'image correspondante est dessinée dans un `<canvas>`.

Résultat : une animation fluide qui avance et recule avec le scroll, comme une vidéo qu'on "scrube".

---

## 📦 Technologies

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [Three.js](https://threejs.org) + [@react-three/fiber](https://r3f.docs.pmnd.rs) + [@react-three/drei](https://drei.docs.pmnd.rs)
- [GSAP](https://gsap.com) (ScrollTrigger, SplitText)
- [Lenis](https://lenis.darkroom.engineering) (smooth scroll)
- Polices : Fraunces + Manrope (via Fontsource, chargées localement)

Projet de démonstration — marque, adresse et prix fictifs.
