#!/usr/bin/env bash
#
# Télécharge les VRAIES photos et vidéos du site (Unsplash + Mixkit, licences gratuites)
# puis prépare tous les fichiers de public/ avec ffmpeg.
#
#   npm run media            # tout refaire
#   npm run media -- hero    # une seule partie : hero | sequence | process | photos
#
# Pré-requis : curl + ffmpeg (avec libx264, libvpx-vp9 et libwebp).
# Les fichiers bruts sont gardés dans .media-cache/ (ignoré par git).
# Sources et licences : voir CREDITS.md
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="${MEDIA_CACHE:-$ROOT/.media-cache}"
PUB="$ROOT/public"
ONLY="${1:-all}"

mkdir -p "$CACHE" "$PUB/video" "$PUB/sequence" "$PUB/images/products" "$PUB/images/origins"

FF=(ffmpeg -hide_banner -loglevel error -y)

fetch() { # url fichier
  if [ ! -s "$2" ]; then
    echo "  ↓ $1" >&2
    curl -fsSL --retry 3 -o "$2.part" "$1" && mv "$2.part" "$2"
  fi
}

mixkit() { # id résolution -> chemin du fichier
  local f="$CACHE/mixkit-$1-$2.mp4"
  fetch "https://assets.mixkit.co/videos/$1/$1-$2.mp4" "$f"
  echo "$f"
}

# photo Unsplash recadrée en 4:5 autour d'un point focal (x, y entre 0 et 1)
unsplash() { # photo-id largeur hauteur fx fy destination
  local f="$CACHE/unsplash-$1-$2x$3.webp"
  fetch "https://images.unsplash.com/photo-$1?w=$2&h=$3&fit=crop&crop=focalpoint&fp-x=$4&fp-y=$5&q=78&fm=webp" "$f"
  cp "$f" "$6"
}

# Boucle sans coupure : la fin de la vidéo se fond dans son début (fondu de 1 s).
# entrée, début, fin, largeur, hauteur, crf mp4, crf webm, sortie (sans extension)
seamless_loop() {
  local src=$1 a=$2 b=$3 w=$4 h=$5 crf=$6 crfw=$7 out=$8
  local fx="[0:v]scale=${w}:${h}:flags=lanczos,setsar=1,fps=24,split[x][y];
    [x]trim=start=$((a + 1)):end=${b},setpts=PTS-STARTPTS[main];
    [y]trim=start=${a}:end=$((a + 1)),setpts=PTS-STARTPTS[head];
    [main][head]xfade=transition=fade:duration=1:offset=$((b - a - 2)),format=yuv420p[v]"
  "${FF[@]}" -i "$src" -filter_complex "$fx" -map "[v]" -an \
    -c:v libx264 -preset slow -crf "$crf" -movflags +faststart "$out.mp4"
  "${FF[@]}" -i "$src" -filter_complex "$fx" -map "[v]" -an \
    -c:v libvpx-vp9 -b:v 0 -crf "$crfw" -row-mt 1 -deadline good -cpu-used 2 "$out.webm"
  "${FF[@]}" -i "$out.mp4" -frames:v 1 -q:v 4 "$out-poster.jpg"
}

# ---------------------------------------------------------------- Hero
if [[ $ONLY == all || $ONLY == hero ]]; then
  echo "▸ Hero : tasse fumante au soleil (Mixkit #808)"
  seamless_loop "$(mixkit 808 1080)" 1 10 1920 1080 20 31 "$PUB/video/hero-loop"
fi

# ---------------------------------------------------------------- Séquence au scroll
# 4 plans réels enchaînés en fondu : grains -> tassage -> extraction -> latte art.
# Chaque plan est rééchantillonné à un nombre fixe d'images, 150 images au total.
if [[ $ONLY == all || $ONLY == sequence ]]; then
  echo "▸ Séquence : 150 images (Mixkit #4985, #3572, #47954, #41858)"
  rm -f "$PUB/sequence/"*.webp
  S0=$(mixkit 4985 1080)  # grains qui tombent dans le moulin
  S1=$(mixkit 3572 1080)  # tassage du porte-filtre
  S2=$(mixkit 47954 720)  # extraction de l'espresso (porte-filtre sans bec)
  S3=$(mixkit 41858 1080) # latte art
  # durée de chaque plan à 24 i/s : 41, 40, 41, 40 images ; fondus de 4 images
  seg() { # index début fin images
    local rate
    rate=$(awk "BEGIN { printf \"%.5f\", $4 / ($3 - $2) }")
    echo "[$1:v]trim=start=$2:end=$3,setpts=PTS-STARTPTS,scale=1600:900:flags=lanczos:force_original_aspect_ratio=increase,crop=1600:900,setsar=1,fps=$rate,setpts=N/24/TB,fps=24[s$1];"
  }
  FX="$(seg 0 11.0 16.7 41)$(seg 1 0.0 6.2 40)$(seg 2 0.3 10.3 41)$(seg 3 1.0 6.1 40)"
  t() { awk "BEGIN { printf \"%.6f\", $1 / 24 }"; } # images -> secondes
  FX+="[s0][s1]xfade=transition=fade:duration=$(t 4):offset=$(t 37)[a];"
  FX+="[a][s2]xfade=transition=fade:duration=$(t 4):offset=$(t 73)[b];"
  FX+="[b][s3]xfade=transition=fade:duration=$(t 4):offset=$(t 110),eq=contrast=1.04:saturation=1.06[v]"
  "${FF[@]}" -i "$S0" -i "$S1" -i "$S2" -i "$S3" -filter_complex "$FX" -map "[v]" \
    -frames:v 150 -c:v libwebp -quality 72 -compression_level 6 -start_number 1 \
    "$PUB/sequence/frame_%04d.webp"
  echo "  $(ls "$PUB/sequence" | wc -l) images"
fi

# ---------------------------------------------------------------- Vidéo "Savoir-faire"
if [[ $ONLY == all || $ONLY == process ]]; then
  echo "▸ Savoir-faire : grains qui tombent (Mixkit #4982)"
  seamless_loop "$(mixkit 4982 1080)" 1 12 1280 720 27 38 "$PUB/video/beans-loop"
fi

# ---------------------------------------------------------------- Photos
if [[ $ONLY == all || $ONLY == photos ]]; then
  echo "▸ Photos des boissons et des origines (Unsplash)"
  P="$PUB/images/products"
  unsplash 1510591509098-f4fdc6d0ff04 900 1125 0.56 0.50 "$P/espresso.webp"
  unsplash 1557006021-b85faa2bc5e2 900 1125 0.50 0.55 "$P/cappuccino.webp"
  unsplash 1502462041640-b3d7e50d0662 900 1125 0.50 0.55 "$P/latte.webp"
  unsplash 1461023058943-07fcbe16d735 900 1125 0.38 0.55 "$P/coldbrew.webp"
  O="$PUB/images/origins"
  unsplash 1774529233247-d3f34ed11994 960 1200 0.45 0.45 "$O/ethiopia.webp"
  unsplash 1653302800594-7e40cf0767fc 960 1200 0.50 0.50 "$O/colombia.webp"
  unsplash 1652015496419-58606c1b5d1c 960 1200 0.55 0.50 "$O/brazil.webp"
fi

echo "✓ Médias prêts dans public/"
