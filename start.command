#!/bin/bash
cd "$(dirname "$0")"

# Charger le PATH avec node si présent
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js introuvable. Installe-le depuis https://nodejs.org puis relance."
  read -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 Installation des dépendances..."
  npm install
fi

if grep -q "PASTE_YOUR_MAPBOX" .env 2>/dev/null; then
  echo "⚠️  Token Mapbox manquant dans .env. Édite .env avant de lancer."
  read -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

echo "🚀 Lancement du serveur de dev..."
npm run dev
