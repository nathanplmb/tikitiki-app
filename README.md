# TIKITIKI

Application mobile de mixologie : un catalogue de cocktails intégré, utilisable hors ligne, une IA (Gemini) pour créer ou adapter des recettes, et deux univers visuels.

- **Chic** : « Liquid Noir », verres réalistes en 3D interactive, glassmorphism, lumière adaptée au cocktail affiché. 215 recettes (classiques IBA, classiques, créations maison, 33 sans alcool).
- **Crackhead** : pré-soirée et épicerie de nuit, thème heavy metal × verre fumé, orage animé (éclairs, nuages, étincelles, particules). 81 références : flashs en bouteille 50 cl, bières fortes, premix, shots, et un coin SAM sans alcool.

## Fonctionnalités

- Accueil immersif (cocktail du jour en Chic, flash qui change toutes les 10 s en Crackhead), l'interface prend la couleur de la boisson.
- Labo : création IA ou à partir de Mon bar (inventaire, recettes réalisables, achats qui débloquent le plus de recettes).
- Découvrir : Pass or Smash et catalogue avec recherche (accents, synonymes, marques), filtres et collections.
- Collection, notes et évaluations, comparaison, liste de courses, mode soirée avec quantités consolidées.
- Données stockées localement, export/import JSON. Pas de compte requis.

## Lancer en local

Prérequis : Node.js 22+.

```bash
npm install
```

```bash
npm run dev
```

L'application tourne sur http://localhost:3000. Sans clé Gemini, tout fonctionne sauf la création IA (le serveur renvoie une erreur explicite, jamais de fausse recette).

Pour activer l'IA, crée `.env.local` à partir de `.env.example` et renseigne `GEMINI_API_KEY` (optionnel : `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`). La clé reste côté serveur.

## Scripts

- `npm run lint` : vérification TypeScript
- `npm test` : tests Vitest (catalogue, moteur de recherche, sécurité IA, stockage, thème)
- `npm run build` : build de production
- `npm start` : serveur de production

## Données

Les recettes sont des données locales versionnées (`src/catalog/`). Les dosages sont une écriture propre à TIKITIKI. Les produits du mode Crackhead sont décrits par type ; les visuels reprennent la forme et le code couleur des emballages, sans logo de marque. Les degrés d'alcool ne sont indiqués que lorsqu'une source les confirme.

## Avertissement

L'abus d'alcool est dangereux pour la santé, à consommer avec modération. Les produits très fortement dosés sont signalés dans l'application. Réservé aux personnes majeures.
