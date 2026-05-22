#!/usr/bin/env bash
set -e
REPO="https://github.com/Amirmobash/musterteil.de.git"
DIR="musterteil.de"
if [ ! -d "$DIR/.git" ]; then
  git clone "$REPO" "$DIR"
fi
rsync -av --exclude "$DIR" --exclude ".git" ./ "$DIR"/
cd "$DIR"
git add .
git commit -m "Upload musterteil.de professional website" || echo "Nothing to commit"
git push origin main
