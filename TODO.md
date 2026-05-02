# TODO

## Carte — ActivityCard

- [ ] **Brancher le token Mapbox**
  - Ajouter le token dans `.env.local` : `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx`
  - Le composant bascule automatiquement du SVG fallback vers la vraie carte dès que le token est présent

- [ ] **Brancher les coordonnées GPS Garmin**
  - Passer `coordinates={[[lat, lng], [lat, lng], ...]}` à `<ActivityCard>`
  - Format attendu : `[number, number][]` en `[lat, lng]` (standard GPS/Garmin)
  - L'encodage Polyline + construction URL Mapbox sont déjà en place

- [ ] **Simplifier le tracé si trop de points**
  - URL Mapbox limitée à ~8 000 caractères
  - Si l'activité dépasse ~500 points GPS, implémenter un algorithme de simplification (Ramer–Douglas–Peucker)

- [ ] **Remplacer la card statique par MapLibre GL JS** (vue interactive détail activité)
  - Style désaturé custom (cf. design-system.md § 4.8)
  - Préféré à Mapbox pour le pricing sur les vues interactives
