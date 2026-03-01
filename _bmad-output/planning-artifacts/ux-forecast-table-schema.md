# ForecastTable — Schema UX

## 1. Layout actuel (implemente)

Total deplace a gauche. Quatre panneaux-cartes flottants (colores avec heat-map) avec coins arrondis (`6px`) et gaps sur les 4 cotes. Les colonnes sans heat-map (Score, Heure, Seeing, Transp., Lune) restent fixes sans panneau. Les en-tetes restent en bande continue sans gap ni arrondi.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              📅 lundi-mardi 1 mars 2026                                         │
├──────┬──────┬────────┬──────┬─────┬──────┬────────┬──────┬────────┬──────┬──────┤
│  ✓   │  H   │ Total  │ Bas  │ Moy │ Haut │ Humid. │ Vent │ Seeing │Transp│  🌙  │
│      │      │        │        OpenMeteo  │ OpenMeteo      │  7Timer        │      │
│      │      ╭────────╮  ╭──────┬─────┬──────╮  ╭────────┬──────╮                │
│  ✅  │🌙18h │   8%   │  │ 12%  │ 5%  │  0%  │  │  62%   │  11  │  6/8   │ 5/8  │ 45%  │
│  ✅  │🌙19h │   5%   │  │  8%  │ 3%  │  0%  │  │  58%   │   9  │  7/8   │ 6/8  │ 45%  │
│  ▲   │🌙20h │  30%   │  │ 35%  │ 20% │ 10%  │  │  70%   │  15  │  4/8   │ 4/8  │ 45%  │
│  🔴  │🌙21h │  55%   │  │ 60%  │ 45% │ 25%  │  │  82%   │  22  │  3/8   │ 3/8  │ 45%  │
│      │      ╰────────╯  ╰──────┴─────┴──────╯  ╰────────┴──────╯                │
└──────┴──────┴────────┴──────┴─────┴──────┴────────┴──────┴────────┴──────┴──────┘

 FIXE       TOTAL(solo)   CLOUD (dyn.)    METEO (fixe)            FIXE
```

Changements implementes :
- Ligne `source-header` (provenance API) ajoutee sous `sub-header`
- Couleurs des en-tetes rehaussees (`#90a4ae` sub-header, `#78909c` source-header)
- Total deplace a gauche (apres H, avant les blocs cloud)
- Systeme de panneaux-cartes avec gaps horizontaux (`cloud-gap` spacers) et verticaux (`inset box-shadow`)
- Coins arrondis (`border-radius: 6px`) sur les panneaux flottants
- `border-bottom: none` sur la derniere DataRow des panneaux (evite fuite visuelle dans le vgap)
- `border-collapse: separate; border-spacing: 0` sur le `<table>` (requis pour que border-radius fonctionne sur les `<td>`)

---

## 2. Layout — sources multiples

Chaque nouvelle API cloud ajoute un panneau-carte supplementaire. Les panneaux Total, Cloud N et Meteo sont flottants. Les colonnes fixes (Score, Heure, Seeing, Transp., Lune) encadrent les panneaux.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         📅 lundi-mardi 1 mars 2026                                              │
├──────┬──────┬────────┬──────┬─────┬──────┬──────┬─────┬──────┬────────┬──────┬────────┬──────┬──────┤
│  ✓   │  H   │ Total  │ Bas  │ Moy │ Haut │ Bas  │ Moy │ Haut │ Humid. │ Vent │ Seeing │Transp│  🌙  │
│      │      │        │     OpenMeteo     │   NouvelleAPI     │ OpenMeteo      │  7Timer        │      │
│      │      ╭────────╮  ╭──────┬─────┬──────╮  ╭──────┬─────┬──────╮  ╭────────┬──────╮                │
│  ✅  │🌙18h │   8%   │  │ 12%  │ 5%  │  0%  │  │  8%  │ 3%  │  1%  │  │  62%   │  11  │  6/8   │ 5/8  │ 45%  │
│  ✅  │🌙19h │   5%   │  │  8%  │ 3%  │  0%  │  │  5%  │ 2%  │  0%  │  │  58%   │   9  │  7/8   │ 6/8  │ 45%  │
│  ▲   │🌙20h │  30%   │  │ 35%  │ 20% │ 10%  │  │ 40%  │ 18% │ 12%  │  │  70%   │  15  │  4/8   │ 4/8  │ 45%  │
│  🔴  │🌙21h │  55%   │  │ 60%  │ 45% │ 25%  │  │ 55%  │ 40% │ 20%  │  │  82%   │  22  │  3/8   │ 3/8  │ 45%  │
│      │      ╰────────╯  ╰──────┴─────┴──────╯  ╰──────┴─────┴──────╯  ╰────────┴──────╯                │
└──────┴──────┴────────┴──────┴─────┴──────┴──────┴─────┴──────┴────────┴──────┴────────┴──────┴──────┘

 FIXE       TOTAL(solo)   CLOUD 1 (dyn.)     CLOUD 2 (dyn.)    METEO (fixe)            FIXE
```

---

## 4. Ordre des colonnes

| #  | Colonne | Groupe        | Panneau flottant |
|----|---------|---------------|------------------|
| 1  | ✓       | Score         | Non — fixe gauche |
| 2  | H       | Heure         | Non — fixe gauche |
| 3  | **Total** | **Aggrege** | **Oui — solo** |
| 4  | Bas     | Cloud API 1   | Oui — cloud 1  |
| 5  | Moy     | Cloud API 1   | Oui — cloud 1  |
| 6  | Haut    | Cloud API 1   | Oui — cloud 1  |
| …  | Bas     | Cloud API N   | Oui — cloud N  |
| …  | Moy     | Cloud API N   | Oui — cloud N  |
| …  | Haut    | Cloud API N   | Oui — cloud N  |
| -  | Humid.  | Meteo         | Oui — meteo    |
| -  | Vent    | Meteo         | Oui — meteo    |
| -  | Seeing  | Astro         | Non — fixe droite |
| -  | Transp. | Astro         | Non — fixe droite |
| -  | 🌙      | Lune          | Non — fixe droite |

> Les panneaux flottants sont les colonnes avec heat-map coloree. Les colonnes fixes (Score, Heure, Seeing, Transp., Lune) n'ont pas de heat-map et restent collees au tableau sans gaps ni arrondis.

---

## 5. Systeme de panneaux-cartes (Panel Card System)

### Principe

Seules les colonnes avec **heat-map coloree** sont regroupees en panneaux-cartes flottants. Chaque panneau est visuellement detache avec des **gaps sur les 4 cotes** et des **coins arrondis aux 4 angles**. Les colonnes sans heat-map (Score, Heure, Seeing, Transp., Lune) restent fixes, collees au tableau. Les en-tetes (day-header, sub-header, source-header) restent en **bande continue** sans gap ni arrondi.

### Les 5 zones

| Zone | Colonnes | Type | Panneau flottant |
|------|----------|------|------------------|
| **Fixe gauche** | ✓, H | Fixe | Non |
| **Total** | Total | Solo | Oui — `panelSolo` (4 coins) |
| **Cloud N** | Bas, Moy, Haut (par API) | Dynamique | Oui — `panelL` / `panelI` / `panelR` |
| **Meteo** | Humid., Vent | Fixe | Oui — `panelL` / `panelR` |
| **Fixe droite** | Seeing, Transp., 🌙 | Fixe | Non |

### Anatomie d'un panneau

Tous les panneaux suivent la meme anatomie (exemple avec le panneau cloud) :

```
       gap gauche          gap droite
       (cloud-gap)           (cloud-gap)
          │                    │
          │    ╭──────┬─────┬──────╮
 gap haut │ →  │      │     │      │   ← inset box-shadow top (5px, #0d0d18)
          │    │ 12%  │ 5%  │  0%  │
          │    │  8%  │ 3%  │  0%  │
          │    │ 35%  │ 20% │ 10%  │
 gap bas  │ →  │      │     │      │   ← inset box-shadow bottom (5px, #0d0d18)
          │    ╰──────┴─────┴──────╯
```

### Les gaps

| Gap       | Implementation |
|-----------|----------------|
| Gauche    | Cellule `<td class="cloud-gap">` (5px, transparent en DataRow, herite bg en headers) |
| Droite    | Cellule `<td class="cloud-gap">` (idem) |
| Haut      | `box-shadow: inset 0 5px 0 0 #0d0d18` sur premiere DataRow |
| Bas       | `box-shadow: inset 0 -5px 0 0 #0d0d18` sur derniere DataRow + `border-bottom: none` |

### Bords arrondis — regle universelle

**Chaque panneau** a ses 4 coins arrondis (`border-radius: 6px`) :

- **Premiere DataRow** :
  - Cellule la plus a gauche du panneau → `borderTopLeftRadius`
  - Cellule la plus a droite du panneau → `borderTopRightRadius`
- **Derniere DataRow** :
  - Cellule la plus a gauche du panneau → `borderBottomLeftRadius`
  - Cellule la plus a droite du panneau → `borderBottomRightRadius`
- **Lignes intermediaires** : aucun arrondi
- **Panneau solo** (Total) : les 4 coins sur la meme cellule (`panelSolo`)

#### Carte des coins par cellule

| Cellule | Panneau | Style | Coin premiere row | Coin derniere row |
|---------|---------|-------|-------------------|-------------------|
| Total | Total (solo) | `panelSolo` | `topLeft` + `topRight` | `bottomLeft` + `bottomRight` |
| Bas | Cloud | `panelL` | `topLeft` | `bottomLeft` |
| Haut | Cloud | `panelR` | `topRight` | `bottomRight` |
| Humid. | Meteo | `panelL` | `topLeft` | `bottomLeft` |
| Vent | Meteo | `panelR` | `topRight` | `bottomRight` |

> Moy est `panelI` (interieur, pas de coin). Score, H, Seeing, Transp., 🌙 n'ont aucun panneau.

### Duplicabilite

Ajouter une API cloud = ajouter un panneau-carte supplementaire entre le dernier panneau cloud et le panneau meteo. Chaque panneau est independant avec ses propres gaps et arrondis.

---

## 6. Colonne Total — Panneau solo

Total est un **panneau flottant solo** (une seule colonne). Raisons de l'isoler :
- C'est une valeur agregee (moyenne/synthese de toutes les sources)
- Elle n'appartient pas a une source API unique
- Elle a sa propre heat-map et merite un traitement visuel distinct

**Position** : entre la zone fixe gauche (Score, Heure) et les panneaux cloud. Ne bouge pas quand on ajoute des sources.

```
FIXE       TOTAL    Panneaux Cloud (dyn.)     METEO         FIXE
✓  H    ╭────────╮  ╭─────╮  ╭─────╮  ╭─────╮  ╭──────┬──────╮  Seeing Transp. 🌙
        │ Total  │  │ API1│  │ API2│  │ API3│  │Humid.│ Vent │
        ╰────────╯  ╰─────╯  ╰─────╯  ╰─────╯  ╰──────┴──────╯
```

---

## 7. En-tetes (3 lignes par section jour)

### Ligne 1 — day-header
- **Contenu** : `📅 {jour_precedent}-{jour_courant} {date}`
- **Fond** : `#111128` | **Texte** : `#7986cb`
- **Taille** : `0.75rem`, `font-weight: 600`
- **Colspan** : toute la largeur

### Ligne 2 — sub-header (noms de colonnes)
- **Contenu** : ✓ H Total Bas Moy Haut ... Humid. Vent Seeing Transp. 🌙
- **Fond** : `#0d0d1e` | **Texte** : `#90a4ae`
- **Taille** : `0.65rem`, `font-weight: 600`, `uppercase`

### Ligne 3 — source-header (provenance)
- **Contenu par groupe** (inclut les cellules `cloud-gap` spacers) :

| Cellules         | Colspan | Texte       |
|------------------|---------|-------------|
| ✓                | 1       | (vide)      |
| H                | 1       | (vide)      |
| cloud-gap        | 1       | (spacer)    |
| Total            | 1       | (vide)      |
| cloud-gap        | 1       | (spacer)    |
| Bas Moy Haut     | 3       | `OpenMeteo` |
| cloud-gap        | 1       | (spacer)    |
| Humid. Vent      | 2       | `OpenMeteo` |
| cloud-gap        | 1       | (spacer)    |
| Seeing Transp.   | 2       | `7Timer`    |
| 🌙               | 1       | (vide)      |

- **Fond** : `#0d0d1e` | **Texte** : `#78909c`
- **Taille** : `0.55rem`, `font-weight: 600`, `uppercase`

> Les 3 lignes d'en-tete restent en **bande continue** (pas de gap, pas d'arrondi). Le systeme de panneaux-cartes ne s'applique qu'aux lignes de donnees (DataRow).

---

## 8. Detail des cellules — Valeurs et couleurs

### Score (✓)

| Condition              | Emoji | Couleur        |
|------------------------|-------|----------------|
| Total ≤ 20% (nuit)     | ✅    | `#69f0ae` vert |
| Total 21-50% (nuit)    | ▲     | `#ffd54f` jaune|
| Total > 50% (nuit)     | 🔴    | `#263238` gris |
| Jour                   | ·     | `#263238` gris |

Seuil : `THR_CLOUD = 20`. Pas de heat-map, fond herite.

### Heure (H)

- Format : `HHh` (ex: `18h`). Icone 🌙 si nuit (`color: #3949ab`, `0.6rem`).
- Texte : `#90a4ae`. Fond fixe : `#0a0a14`.
- Pas de heat-map.

### Total

- Affichage : `{v}%`. Normalisation : `tCloud(v) = 1 - v/100`.
- Heat-map : `heatCell(tCloud(v), night)`.
- Pas dans un bloc flottant.

### Bas / Moy / Haut (par bloc cloud)

- Affichage : `{v}%`. Normalisation : `tCloud(v) = 1 - v/100`.
- Heat-map : `heatCell(tCloud(v), night)`.

### Humidite

- Affichage : `{v}%`. Normalisation : `tHumid(v) = 1 - max(0, v-40) / 60`.
- Zone morte sous 40% (tout est vert). Plage active : 40-100%.

### Vent

- Affichage : `{v}` (km/h, sans %). Normalisation : `tWind(v) = 1 - min(v,40) / 40`.
- Plafond a 40 km/h (tout est rouge au-dela).

### Seeing / Transparence

- Affichage : `{v}/8` ou `—` si absent. Normalisation : `(v-1) / 7`, null si v=0.
- Echelle 1-8, sens direct (8 = vert).

### Lune (🌙)

- Affichage : `{illum}%` (nuit) ou `—` (jour). Pas de heat-map.
- Seuils fixes : `< 25%` → `#69f0ae` | `25-60%` → `#ffd54f` | `≥ 60%` → `#ef9a9a`.
- Fond fixe : `#090912`.

### Formule heat-map commune : `heatCell(t, night)`

```
Background :
  hue = t < 0.5 ? t * 60 : 30 + (t - 0.5) * 180     → 0° rouge → 30° orange → 120° vert
  sat = 70 + t * 25                                    → 70% a 95%
  lig = nuit ? 12 + t * 20 : 8 + t * 10               → nuit: 12-32% | jour: 8-18%

Texte :
  hue = meme que background
  lig = 55 + t * 30                                    → 55% a 85%
  sat = 80%
```

| t    | Hue  | Fond (nuit)             | Rendu       |
|------|------|-------------------------|-------------|
| 0.0  | 0°   | `hsl(0, 70%, 12%)`      | rouge sombre|
| 0.25 | 15°  | `hsl(15, 76%, 17%)`     | rouge-orange|
| 0.5  | 30°  | `hsl(30, 83%, 22%)`     | orange      |
| 0.75 | 75°  | `hsl(75, 89%, 27%)`     | jaune-vert  |
| 1.0  | 120° | `hsl(120, 95%, 32%)`    | vert        |

---

## 9. Styles globaux

### Cellules
`padding: 3px 8px` | `text-align: center` | `font-weight: 700` | `font-size: 0.8rem` | `height: 26px`

### Lignes nuit vs jour

| Type | Fond       | Opacity | Hover             |
|------|------------|---------|-------------------|
| Nuit | `#090912`  | 1.0     | `brightness(1.2)` |
| Jour | `#0c0c1a`  | 0.5     | `brightness(1.2)` |

> Le fond nuit/jour est ecrase par `heatCell()` sur les colonnes avec heat-map. Seuls Score, Heure et Lune gardent leur fond fixe.

---

## 10. Arbre des composants

```
ForecastTable.jsx               ← wrapper <table> (border-collapse: separate), scroll spy
 └── DaySection.jsx             ← x N jours, forwardRef, passe isFirst/isLast a DataRow
      ├── <tr class="day-header">     ← 📅 date (colspan=15)
      ├── <tr class="sub-header">     ← noms colonnes (15 cols avec 4 cloud-gap spacers)
      ├── <tr class="source-header">  ← provenance API par groupe (15 cols)
      └── DataRow.jsx                 ← x 24 heures, recoit props isFirst/isLast
           ├── td score-cell               ← ✓          ╮ FIXE GAUCHE
           ├── td hour                     ← HHh 🌙      ╯ (pas de panneau)
           ├── td.cloud-gap                ← spacer transparent
           ├── td Total (heatCell)         ← PANEL TOTAL solo (panelSolo, 4 coins)
           ├── td.cloud-gap                ← spacer transparent
           ├── td Bas (heatCell, panelL)  ╮
           ├── td Moy (heatCell, panelI)  ├── PANEL CLOUD 1 (coins + vgap)
           ├── td Haut (heatCell, panelR) ╯
           ├── td.cloud-gap                ← spacer transparent
           ├── (td Bas / Moy / Haut) ╮    ← PANEL CLOUD N (si API supplementaire)
           ├── td.cloud-gap          ╯    ← spacer transparent
           ├── td Humid. (heatCell, panelL) ╮ PANEL METEO (coins + vgap)
           ├── td Vent (heatCell, panelR)   ╯
           ├── td.cloud-gap                ← spacer transparent
           ├── td Seeing (heatCell)        ╮
           ├── td Transp. (heatCell)       ├── FIXE DROITE (pas de panneau)
           └── td 🌙 (moonColor)           ╯
```

## 11. Fichiers source

| Fichier | Role |
|---------|------|
| `web-react/src/components/ForecastTable.jsx` | Wrapper principal, scroll spy |
| `web-react/src/components/DaySection.jsx`    | Section jour, en-tetes, source-header |
| `web-react/src/components/DataRow.jsx`        | Ligne horaire, score, heatCell |
| `web-react/src/GlobalStyle.js`                | Styles CSS (theme sombre) |
| `web-react/src/utils/colors.js`               | heatCell, tCloud, tHumid, tWind, tSeeing, tTransp |
| `web-react/src/utils/astronomy.js`            | moonIllumination, isNight, buildSunMap |
| `web-react/src/hooks/useWeatherData.js`       | Fetch OpenMeteo + 7Timer, groupement |
