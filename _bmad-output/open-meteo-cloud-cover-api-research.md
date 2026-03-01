# Open-Meteo Cloud Cover API — Recherche Technique Exhaustive

> Document de référence pour l'intégration multi-modèle dans AstroGuard.
> Généré le 2026-03-01.

---

## Table des matières

1. [Vue d'ensemble de l'API](#1-vue-densemble-de-lapi)
2. [Endpoint `/v1/forecast` (Best-Match)](#2-endpoint-v1forecast-best-match)
3. [Endpoint `/v1/meteofrance` (AROME / ARPEGE)](#3-endpoint-v1meteofrance-arome--arpege)
4. [Endpoint `/v1/ecmwf` (IFS HRES)](#4-endpoint-v1ecmwf-ifs-hres)
5. [Endpoint `/v1/dwd-icon` (DWD ICON)](#5-endpoint-v1dwd-icon-dwd-icon)
6. [Deep Dive modèles : AROME, ECMWF IFS, GFS](#6-deep-dive-modèles)
7. [Définitions des couches nuageuses et altitudes](#7-définitions-des-couches-nuageuses-et-altitudes)
8. [Méthodes de calcul de la couverture nuageuse](#8-méthodes-de-calcul-de-la-couverture-nuageuse)
9. [API Ensemble et données probabilistes](#9-api-ensemble-et-données-probabilistes)
10. [Paramètre `models` et requêtes multi-modèle](#10-paramètre-models-et-requêtes-multi-modèle)
11. [API historique (vérification)](#11-api-historique-vérification)
12. [API Previous Runs](#12-api-previous-runs)
13. [Latence des données et pipeline de mise à jour](#13-latence-des-données-et-pipeline-de-mise-à-jour)
14. [Limites de taux et politique d'usage](#14-limites-de-taux-et-politique-dusage)
15. [Breaking change : renommage des paramètres](#15-breaking-change--renommage-des-paramètres)
16. [Quirks et limitations connus](#16-quirks-et-limitations-connus)
17. [Tableau comparatif de synthèse](#17-tableau-comparatif-de-synthèse)
18. [Sources](#18-sources)

---

## 1. Vue d'ensemble de l'API

**Base URL :** `https://api.open-meteo.com`

**Licence :** CC-BY 4.0 (attribution requise, y compris sur le tier gratuit)

**Format de réponse :** JSON. Structure type :

```json
{
  "latitude": 48.85,
  "longitude": 2.35,
  "elevation": 35.0,
  "generationtime_ms": 2.21,
  "utc_offset_seconds": 0,
  "timezone": "Europe/Paris",
  "timezone_abbreviation": "CET",
  "hourly": {
    "time": ["2026-03-01T00:00", "2026-03-01T01:00", "..."],
    "cloud_cover": [45, 50, "..."],
    "cloud_cover_low": [10, 15, "..."],
    "cloud_cover_mid": [20, 25, "..."],
    "cloud_cover_high": [30, 35, "..."]
  },
  "hourly_units": {
    "cloud_cover": "%",
    "cloud_cover_low": "%",
    "cloud_cover_mid": "%",
    "cloud_cover_high": "%"
  }
}
```

### Paramètres communs (tous endpoints)

| Paramètre | Type | Description |
|-----------|------|-------------|
| `latitude` | float (req.) | Latitude, virgule pour multi-locations |
| `longitude` | float (req.) | Longitude |
| `hourly` | string[] | Variables horaires demandées |
| `daily` | string[] | Variables quotidiennes agrégées |
| `temperature_unit` | string | `celsius` / `fahrenheit` |
| `wind_speed_unit` | string | `kmh` / `ms` / `mph` / `kn` |
| `precipitation_unit` | string | `mm` / `inch` |
| `timeformat` | string | `iso8601` / `unixtime` |
| `timezone` | string | Ex : `Europe/Paris`, `auto` |
| `past_days` | int | 0–92 |
| `forecast_days` | int | Nombre de jours de prévision |
| `start_date` / `end_date` | string | `yyyy-mm-dd` |
| `cell_selection` | string | `land` / `sea` / `nearest` |
| `elevation` | float | Override de l'altitude automatique |
| `apikey` | string | Uniquement pour les tiers payants |
| `models` | string | Sélection de modèle(s) spécifique(s) |

---

## 2. Endpoint `/v1/forecast` (Best-Match)

### URL

```
https://api.open-meteo.com/v1/forecast
```

### Variables couverture nuageuse (horaire)

| Paramètre | Description | Unité |
|-----------|-------------|-------|
| `cloud_cover` | Couverture nuageuse totale (fraction de surface) | % |
| `cloud_cover_low` | Nuages bas, jusqu'à ~3 km d'altitude | % |
| `cloud_cover_mid` | Nuages moyens, ~3–8 km d'altitude | % |
| `cloud_cover_high` | Nuages hauts, au-dessus de ~8 km | % |

### Autres variables pertinentes (horaire)

| Paramètre | Description |
|-----------|-------------|
| `relative_humidity_2m` | Humidité relative à 2 m (%) |
| `dew_point_2m` | Point de rosée à 2 m |
| `vapour_pressure_deficit` | VPD (kPa) |
| `wind_speed_10m` | Vent à 10 m |
| `wind_speed_80m` | Vent à 80 m |
| `wind_speed_120m` | Vent à 120 m |
| `wind_speed_180m` | Vent à 180 m |
| `wind_direction_10m` | Direction du vent à 10 m (degrés) |
| `wind_direction_80m` / `120m` / `180m` | Idem aux hauteurs correspondantes |
| `wind_gusts_10m` | Rafale max dans l'heure précédente |
| `visibility` | Visibilité (m) |

### Résolution de grille

2 à 25 km selon le modèle sous-jacent sélectionné par l'algorithme best-match pour la localisation demandée.

### Portée de prévision

- Par défaut : **7 jours** (168 h)
- Maximum : **16 jours** (`&forecast_days=16`)

### Fréquence de mise à jour

Variable selon le modèle sous-jacent : toutes les 1 à 6 heures.

### Résolution temporelle

- Horaire (par défaut)
- 15 minutes disponible (`minutely_15`) pour l'Europe centrale (ICON-D2) et l'Amérique du Nord (HRRR)
- **⚠️ La couverture nuageuse N'EST PAS disponible en 15 min** — uniquement précipitations, neige, rayonnement, foudre

### Qu'est-ce que "Best Match" fait exactement ?

L'algorithme best-match sélectionne le modèle haute résolution le plus adapté pour une localisation donnée :

1. **Sélection géographique et heuristique** — le mainteneur (Patrick Zippenfenig) a indiqué que la sélection est basée sur "l'expérience subjective" plutôt qu'un score de compétence automatisé. Des plans existent pour une sélection automatique basée sur la performance des prévisions récentes.

2. **Sélections régionales typiques :**
   - **Europe centrale :** DWD ICON-D2 (2 km) blendé avec ICON-EU et ICON Global
   - **France :** Probablement MeteoFrance AROME/ARPEGE
   - **Amérique du Nord :** NOAA GFS + HRRR (3 km pour le CONUS)
   - **Pays-Bas/Belgique/Europe du Nord :** Modèles KNMI et DMI intégrés
   - **Royaume-Uni :** UK Met Office (avec un délai de 4h)
   - **Fallback global :** ECMWF IFS, DWD ICON Global, ou GFS

3. **Approche de blending :** Plusieurs modèles combinés par variable météo. Des sauts de température ou de couverture nuageuse peuvent se produire au point de transition entre modèles. Un MNT à 90 m est utilisé pour le downscaling de température.

### Exemple d'appel API

```
https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,wind_speed_10m&forecast_days=7&timezone=Europe/Paris
```

---

## 3. Endpoint `/v1/meteofrance` (AROME / ARPEGE)

### URL

```
https://api.open-meteo.com/v1/meteofrance
```

### Modèles disponibles (valeurs exactes du paramètre `models`)

| Valeur `models` | Nom | Région | Résolution | Portée | Mise à jour | Résolution temporelle |
|-----------------|-----|--------|------------|--------|-------------|----------------------|
| `meteofrance_seamless` | AROME Seamless | France + Global | Meilleure dispo | Jusqu'à 4 jours | Variable | Horaire |
| `meteofrance_arpege_seamless` | ARPEGE Seamless | Europe + Global | Meilleure dispo | 4 jours | Toutes les 6h | Horaire |
| `meteofrance_arpege_world` | ARPEGE World | Global | 0.25° (~25 km) | 4 jours | Toutes les 6h | Horaire, 3h après 2 jours |
| `meteofrance_arpege_europe` | ARPEGE Europe | Europe + Afrique du Nord | 0.1° (~11 km) | 4 jours | Toutes les 6h | Horaire |
| `meteofrance_arome_france` | AROME France | France | 0.025° (~2.5 km) | **42 heures** (~2 jours) | Toutes les 3h | Horaire |
| `meteofrance_arome_france_hd` | AROME France HD | France + voisins | 0.01° (~1.5 km) | **42 heures** (~2 jours) | Toutes les 3h | Horaire |

### Variables couverture nuageuse (horaire)

| Paramètre | Description | Unité | Disponibilité |
|-----------|-------------|-------|---------------|
| `cloud_cover` | Couverture nuageuse totale | % | Tous les modèles |
| `cloud_cover_low` | Nuages bas (jusqu'à ~3 km) | % | **⚠️ NON DISPONIBLE pour AROME** — uniquement ARPEGE |
| `cloud_cover_mid` | Nuages moyens (~3–8 km) | % | **⚠️ NON DISPONIBLE pour AROME** — uniquement ARPEGE |
| `cloud_cover_high` | Nuages hauts (au-dessus de ~8 km) | % | **⚠️ NON DISPONIBLE pour AROME** — uniquement ARPEGE |

**⚠️ POINT CRITIQUE :** La couverture nuageuse AROME est **approximée à partir de l'humidité relative**. Les modèles AROME (arome_france, arome_france_hd) ne fournissent que la couverture **totale**. Le breakdown low/mid/high n'est disponible que via les modèles ARPEGE. En utilisant `meteofrance_seamless`, le blend fournira le low/mid/high depuis ARPEGE là où c'est disponible.

### Autres variables pertinentes (horaire)

| Paramètre | Description |
|-----------|-------------|
| `relative_humidity_2m` | Humidité relative à 2 m (%) |
| `dew_point_2m` | Point de rosée à 2 m |
| `vapour_pressure_deficit` | VPD (kPa) |
| `wind_speed_10m` | Vent à 10 m |
| `wind_speed_20m` | Vent à 20 m |
| `wind_speed_50m` | Vent à 50 m |
| `wind_speed_100m` | Vent à 100 m |
| `wind_speed_150m` | Vent à 150 m |
| `wind_speed_200m` | Vent à 200 m |
| `wind_direction_10m` à `200m` | Direction du vent aux hauteurs correspondantes |
| `wind_gusts_10m` | Rafale max (heure précédente) |
| `cape` | CAPE — Convective Available Potential Energy (J/kg) |

Note : les hauteurs de vent diffèrent de l'endpoint par défaut (10m/20m/50m/100m/150m/200m vs 10m/80m/120m/180m).

### Variables aux niveaux de pression

Disponibles à **29 niveaux de pression** : 1000, 950, 925, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 275, 250, 225, 200, 175, 150, 125, 100, 70, 50, 30, 20, 10 hPa.

Variables à chaque niveau :
- `temperature_{level}hPa`
- `relative_humidity_{level}hPa`
- `dew_point_{level}hPa`
- `cloud_cover_{level}hPa`
- `wind_speed_{level}hPa`
- `wind_direction_{level}hPa`
- `geopotential_height_{level}hPa`

### Exemples d'appels API

```
https://api.open-meteo.com/v1/meteofrance?latitude=48.85&longitude=2.35&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,wind_speed_10m&models=meteofrance_seamless&timezone=Europe/Paris
```

```
https://api.open-meteo.com/v1/meteofrance?latitude=48.85&longitude=2.35&hourly=cloud_cover,wind_speed_10m&models=meteofrance_arome_france_hd&timezone=Europe/Paris
```

---

## 4. Endpoint `/v1/ecmwf` (IFS HRES)

### URL

```
https://api.open-meteo.com/v1/ecmwf
```

### Modèles disponibles (valeurs exactes du paramètre `models`)

| Valeur `models` | Nom | Résolution | Portée | Mise à jour | Résolution temporelle |
|-----------------|-----|------------|--------|-------------|----------------------|
| `ecmwf_ifs` | IFS HRES 9km | 9 km (grille O1280) | **10 jours** (240h) | Toutes les 6h (00/06/12/18Z) | 1h (0–90h), 3h (90–144h), 6h (144h+) |
| `ecmwf_ifs025` | IFS 0.25° Open-Data | ~25 km | 15 jours | Toutes les 6h | 3h, 6h après 144h |
| `ecmwf_aifs025` | AIFS Single 0.25° | ~28 km | 15 jours | Toutes les 6h | 6h |

### Variables couverture nuageuse (horaire)

| Paramètre | Description | Unité | Notes |
|-----------|-------------|-------|-------|
| `cloud_cover` | Couverture nuageuse totale (instantanée) | % | Tous les modèles ECMWF |
| `cloud_cover_low` | Nuages bas (jusqu'à ~3 km, instantanée) | % | Modèles IFS |
| `cloud_cover_mid` | Nuages moyens (~3–8 km, instantanée) | % | Modèles IFS |
| `cloud_cover_high` | Nuages hauts (au-dessus de ~8 km, instantanée) | % | Modèles IFS |

### Autres variables pertinentes (horaire)

| Paramètre | Description | Notes |
|-----------|-------------|-------|
| `relative_humidity_2m` | Humidité relative à 2 m | |
| `wind_speed_10m` | Vent à 10 m (instantané) | |
| `wind_speed_100m` | Vent à 100 m (instantané) | |
| `wind_speed_200m` | Vent à 200 m (instantané) | |
| `wind_direction_10m` | Direction du vent à 10 m | |
| `wind_direction_100m` | Direction du vent à 100 m | |
| `wind_direction_200m` | Direction du vent à 200 m | |
| `wind_gusts_10m` | **Max rafale 3 secondes sur les 3 HEURES précédentes** | ⚠️ Fenêtre de 3h, pas 1h comme les autres endpoints |

Note : les hauteurs de vent sont limitées à 10m/100m/200m (moins de niveaux que les autres endpoints).

### Détails de résolution temporelle (IFS HRES 9km)

| Heures | Résolution native | Note |
|--------|-------------------|------|
| 0–90h | **1 heure** | Données natives horaires |
| 90–144h | **3 heures** | Interpolé à l'horaire par Open-Meteo |
| 144h+ | **6 heures** | Interpolé à l'horaire par Open-Meteo |

Pour le modèle IFS 0.25° Open-Data, seule la résolution native 3h et 6h est disponible.

### Détails techniques de la grille

IFS HRES tourne sur la **grille gaussienne réduite octaédrale O1280** (TCO1279), soit environ 9 km de résolution horizontale. Open-Meteo sert la résolution native complète. L'open-data IFS 0.25° est un sous-ensemble à résolution inférieure.

### Variables aux niveaux de pression

Disponibles à **13 niveaux de pression** : 1000, 925, 850, 700, 600, 500, 400, 300, 250, 200, 150, 100, 50 hPa.

Variables à chaque niveau : temperature, relative_humidity, cloud_cover, wind_speed, wind_direction, vertical_velocity, geopotential_height.

### Exemple d'appel API

```
https://api.open-meteo.com/v1/ecmwf?latitude=48.85&longitude=2.35&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m&models=ecmwf_ifs&timezone=Europe/Paris
```

---

## 5. Endpoint `/v1/dwd-icon` (DWD ICON)

### URL

```
https://api.open-meteo.com/v1/dwd-icon
```

Aussi servi via `/v1/forecast` quand ICON est le modèle best-match.

### Modèles disponibles

| Valeur `models` | Région | Résolution | Portée | Mise à jour | Résolution temporelle |
|-----------------|--------|------------|--------|-------------|----------------------|
| `icon_seamless` | Combiné | Meilleure dispo | 7.5 jours | Variable | Horaire |
| `icon_global` | Global | 0.1° (~11 km) | 7.5 jours (180h) | Toutes les 6h | Horaire, 3h après 78h |
| `icon_eu` | Europe | 0.0625° (~7 km) | 5 jours (120h) | Toutes les 3h | Horaire, 3h après 78h |
| `icon_d2` | Europe centrale | 0.02° (~2 km) | 2 jours (48h) | Toutes les 3h | Horaire (15 min pour certaines vars) |

### Variables couverture nuageuse

Identiques à `/v1/forecast` :
- `cloud_cover` (total, %)
- `cloud_cover_low` (jusqu'à ~3 km, %)
- `cloud_cover_mid` (~3–8 km, %)
- `cloud_cover_high` (au-dessus de ~8 km, %)

**Les 4 variables sont des sorties natives du modèle ICON** (low/mid/high sont directement produites par DWD ICON, pas dérivées de l'humidité relative).

### Variables aux niveaux de pression

Disponibles à **19 niveaux** : 1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300, 250, 200, 150, 100, 70, 50, 30 hPa.

`cloud_cover_{level}hPa` est **dérivé de l'humidité relative** via la paramétrisation de Sundqvist et al. (1989), et **peut ne pas correspondre parfaitement** aux variables native low/mid/high.

### Données 15 minutes

ICON-D2 fournit des données à 15 min, mais la couverture nuageuse **N'EST PAS** parmi les variables 15 min. Seules les précipitations, la neige, le rayonnement solaire et la foudre sont disponibles à cette résolution.

---

## 6. Deep Dive modèles

### 6.1 AROME (Météo-France)

**Nom complet :** Application de la Recherche à l'Opérationnel à Méso-Echelle

**Type :** Modèle NWP non-hydrostatique à échelle convective, en aire limitée

**Opérationnel depuis :** Décembre 2008 à Météo-France

**Architecture :**
- Paramétrisations physiques issues du modèle de recherche Meso-NH
- Noyau dynamique issu de Non-Hydrostatic ALADIN (partagé avec HARMONIE-AROME)
- Assimilation de données dérivée du système variationnel ARPEGE-IFS, adapté à la résolution fine d'AROME
- Assimile les données radar ARAMIS (vent Doppler et précipitations) sur base horaire

**Domaines et résolutions :**

| Domaine | Résolution | Grille horizontale | Portée | Runs |
|---------|------------|--------------------|--------|------|
| AROME France | 0.025° (~2.5 km) | ~750×750 points | 42 heures | 5 par jour, toutes les 3h |
| AROME France HD | 0.01° (~1.5 km) | Densité supérieure | 42 heures | Toutes les 3h |
| AROME outre-mer | 1.3 km | Variable | 42 heures | Variable |

**Forces :**
- Excellent pour les phénomènes sévères : précipitations méditerranéennes, orages violents, brouillard, îlots de chaleur urbains
- Assimilation radar horaire → bon nowcasting
- Très haute résolution capte les phénomènes convectifs

**Limitations (spécifique couverture nuageuse) :**
- La couverture nuageuse n'est PAS une sortie native accessible via Open-Meteo ; elle est **approximée à partir de l'humidité relative**
- Seule la couverture **totale** est disponible ; **pas de breakdown low/mid/high** pour AROME
- Faiblesse connue dans la paramétrisation des nuages peu profonds (stratocumulus, petits cumulus) — un article de 2025 adresse spécifiquement "An update of shallow cloud parameterization in the AROME NWP model"
- Portée de prévision courte (42 heures uniquement)

**Modèle parent (ARPEGE) :**
- ARPEGE fournit les conditions aux limites pour AROME
- ARPEGE World : 0.25° (~25 km), 4 jours, toutes les 6h
- ARPEGE Europe : 0.1° (~11 km), 4 jours, toutes les 6h
- ARPEGE fournit la couverture nuageuse native low/mid/high

### 6.2 ECMWF IFS (Integrated Forecasting System)

**Opéré par :** Centre européen pour les prévisions météorologiques à moyen terme (ECMWF), Reading, Royaume-Uni

**Type :** Modèle NWP spectral global hydrostatique

**Cycle actuel :** IFS Cycle 49r1 (en 2025)

**Grille :** Grille gaussienne réduite octaédrale O1280 (TCO1279)
- Résolution horizontale : ~9 km
- Vertical : 137 niveaux modèle, s'étendant jusqu'à ~80 km (mésopause)
- Pas de temps du modèle : 450 secondes

**Calendrier des runs :**

| Initialisation | Portée de prévision |
|---------------|---------------------|
| 00Z | 10 jours (240h) |
| 06Z | 90 heures |
| 12Z | 10 jours (240h) |
| 18Z | 90 heures |

**Disponibilité des données :**
- Diffusion temps réel IFS : disponible pour les membres ECMWF
- Distribution open-data : ~2 heures de délai supplémentaire après le temps réel
- Open-Meteo sert la résolution native complète de 9 km

**Couverture nuageuse :**
- IFS fournit la couverture nuageuse native en catégories low/mid/high
- Définitions utilisant les coordonnées sigma (pression/pression_surface) :
  - **Nuages bas :** sigma > 0.8 (environ surface à ~1800 m)
  - **Nuages moyens :** 0.45 < sigma ≤ 0.8 (environ ~1800 m à ~6300 m)
  - **Nuages hauts :** sigma ≤ 0.45 (environ au-dessus de ~6300 m)
- La paramétrisation des nuages utilise un schéma pronostique avec eau liquide, glace, pluie et neige comme variables pronostiques

**AIFS (Artificial Intelligence Forecasting System) :**
- Lancé opérationnellement en février 2025
- Version ensemble en juillet 2025
- Disponible via Open-Meteo en tant que `ecmwf_aifs025` (0.25°, ~28 km)
- Fournit couverture nuageuse (low, mid, high, total), plus davantage de paramètres de surface

### 6.3 GFS (Global Forecast System) — Comparaison

**Opéré par :** NOAA/NCEP, USA

**Type :** Modèle spectral global avec noyau dynamique FV3 (Finite-Volume Cubed-Sphere)

**Version actuelle :** GFS v16 (depuis le 22 mars 2021)

**Grille :**
- Horizontal : ~13 km (0.11°) pour les jours 0–10
- Passe à ~70 km pour les jours 10–16 (portée étendue)
- Vertical : 127 niveaux jusqu'à ~80 km

**Calendrier des runs :** 4 fois par jour (00Z, 06Z, 12Z, 18Z)

**Sortie de prévision :**
- Horaire pour les premières 120 heures (5 jours)
- 3h jusqu'au jour 10
- 12h jusqu'au jour 16

**Couverture nuageuse dans Open-Meteo :**
- Pour le GFS brut : la couverture nuageuse est nativement disponible
- Pour GFS GraphCast et AIGFS : la couverture nuageuse est **estimée par Open-Meteo** en utilisant l'humidité spécifique + les équations de Murphy & Koop (2005)

**Comparaison avec ECMWF IFS :**

| Caractéristique | ECMWF IFS | GFS |
|----------------|-----------|-----|
| Résolution | 9 km | 13 km (28 km étendu) |
| Niveaux verticaux | 137 | 127 |
| Portée de prévision | 10 jours (HRES) | 16 jours |
| Runs | Toutes les 6h | Toutes les 6h |
| Précision (études) | Prévisions à 5 jours systématiquement meilleures | En amélioration mais toujours derrière |
| Membres d'ensemble | 51 (ENS) | 31 (GEFS) |
| Schéma nuages | Pronostique (natif) | Pronostique (natif) |

**Endpoint Open-Meteo GFS :** `https://api.open-meteo.com/v1/gfs`

Valeurs de modèle disponibles : `gfs_seamless`, `gfs_global`, `hrrr_conus`, `nbm_conus`, `nam_conus`, `gfs_graphcast`, `aigfs`, `hgefs`

---

## 7. Définitions des couches nuageuses et altitudes

### Définitions Open-Meteo selon la documentation

Les descriptions varient légèrement selon les pages de documentation des endpoints :

| Variable | `/v1/forecast` & `/v1/gfs` | `/v1/dwd-icon` | `/v1/ecmwf` | API Historique |
|----------|----------------------------|----------------|-------------|----------------|
| `cloud_cover_low` | "up to 3 km" | "up to 3 km" | "up to 3 km" | **"up to 2 km"** |
| `cloud_cover_mid` | "3–8 km" | "3–8 km" | "3–8 km" | **"2–6 km"** |
| `cloud_cover_high` | "8+ km" | "8+ km" | "8+ km" | **"above 6 km"** |

**⚠️ Note :** L'API Historique (basée sur ERA5) utilise des seuils d'altitude différents (2 km / 6 km) par rapport aux APIs de prévision (3 km / 8 km). Cela s'explique par le fait que les modèles sous-jacents définissent ces frontières différemment.

### Définitions internes ECMWF IFS

ECMWF utilise des coordonnées sigma (p/p_surface) :
- **Bas :** sigma > 0.8 — environ 0 à 1800 m
- **Moyen :** 0.45 < sigma ≤ 0.8 — environ 1800 à 6300 m
- **Haut :** sigma ≤ 0.45 — environ au-dessus de 6300 m

Ces valeurs sont dynamiques et dépendent de la pression de surface, donc l'altitude exacte varie selon la localisation et les conditions météo.

### Définitions standard OMM

L'Atlas International des Nuages de l'OMM définit les étages nuageux :
- **Étage bas :** Surface à 2000 m (6500 ft) — aux latitudes moyennes
- **Étage moyen :** 2000–4000 m (variable selon la latitude, jusqu'à 8000 m)
- **Étage haut :** 3000–8000 m (variable, jusqu'à 12 000 m aux tropiques)
- Ces étages se chevauchent et varient avec la latitude.

### Implications pour l'astronomie

Pour la planification d'observation astronomique :
- **Nuages hauts (cirrus)** : les plus pertinents pour la transparence — souvent invisibles à l'œil nu mais ruinent le contraste
- **Nuages bas et moyens** : bloqueurs complets de toute observation
- **⚠️ Les définitions variables entre modèles** signifient que comparer `cloud_cover_low` entre endpoints différents ne compare pas nécessairement la même couche atmosphérique

---

## 8. Méthodes de calcul de la couverture nuageuse

### Comment les différents modèles calculent la couverture nuageuse dans Open-Meteo

**DWD ICON (natif) :**
- Les couvertures nuageuses low/mid/high sont des **sorties directes du modèle** ICON
- Ce sont les valeurs de couverture nuageuse les plus "natives" disponibles
- Les couvertures aux niveaux de pression (`cloud_cover_{level}hPa`) sont dérivées séparément de l'humidité relative via la paramétrisation de **Sundqvist et al. (1989)**
- Important : les couvertures aux niveaux de pression "may not match perfectly with low, mid and high cloud cover variables"

**ECMWF IFS (natif) :**
- La couverture nuageuse est une variable pronostique de l'IFS
- Utilise un schéma de nuages complet avec eau liquide, glace, pluie et neige
- Low/mid/high sont calculés à partir de la fraction nuageuse du modèle sur les niveaux modèle, intégrés sur des plages de sigma

**Météo-France AROME (approximé) :**
- La couverture nuageuse n'est **PAS une sortie native** accessible via Open-Meteo
- La couverture totale est **approximée à partir de l'humidité relative**
- **Pas de breakdown low/mid/high disponible** pour les modèles AROME
- ARPEGE fournit bien la couverture native low/mid/high

**GFS (natif pour le GFS principal, estimé pour les variantes IA) :**
- GFS principal : couverture nuageuse native
- GFS GraphCast, AIGFS, HGEFS : couverture nuageuse **estimée par Open-Meteo** en utilisant les données d'humidité spécifique et les équations de Murphy & Koop (2005)
- Une transition de phase lisse entre nuages liquides et glacés est appliquée, similaire à l'approche ECMWF IFS

### Problème de précision connu (GitHub Issue #416)

Un cas documenté montrait 100% de couverture nuageuse basse prédite (suggérant du brouillard) alors que les conditions réelles étaient ciel clair. Cause : les niveaux de pression 1000 hPa et 975 hPa montraient 100% d'humidité alors qu'ils étaient **sous l'altitude de la station** (500 m). Le mainteneur a reconnu cela comme une limitation de la dérivation de la couverture nuageuse à partir de l'humidité relative aux niveaux de pression plutôt que des niveaux modèle natifs.

Des plans existent pour intégrer les données de nuages aux niveaux modèle natifs, mais cela "significantly increases processing and storage requirements."

---

## 9. API Ensemble et données probabilistes

### Endpoint

```
https://api.open-meteo.com/v1/ensemble
```

### Modèles d'ensemble disponibles avec couverture nuageuse

| Modèle | Région | Membres | Résolution | Portée | Mise à jour | Temporel |
|--------|--------|---------|------------|--------|-------------|----------|
| ICON-D2-EPS | Europe centrale | 20 | 2 km | 2 jours | Toutes les 3h | Horaire |
| ICON-EU-EPS | Europe | 40 | 13 km | 5 jours | Toutes les 6h | Horaire |
| ICON-EPS | Global | 40 | 26 km | 7.5 jours | Toutes les 12h | Horaire |
| GFS Ensemble 0.25° | Global | 31 | 25 km | 10 jours | Toutes les 6h | 3h |
| GFS Ensemble 0.5° | Global | 31 | 50 km | 35 jours | Toutes les 6h | 3h |
| IFS Ensemble 0.25° | Global | 51 | 25 km | 15 jours | Toutes les 6h | 3h |
| AIFS 0.25° | Global | 51 | 25 km | 15 jours | Toutes les 6h | 6h |
| GEM Ensemble | Global | 21 | 25 km | 16 jours | Toutes les 12h | 3h |
| ACCESS-GE | Global | 18 | 40 km | 10 jours | Toutes les 6h | 3h |
| MOGREPS-UK | UK | 3 | 2 km | 5 jours | Toutes les heures | Horaire |
| MOGREPS-G | Global | 18 | 20 km | 8 jours | Toutes les 6h | Horaire |
| ICON CH1 | Europe centrale | 11 | 1 km | 33 heures | Toutes les 3h | Horaire |
| ICON CH2 | Europe centrale | 21 | 2 km | 12 heures | Toutes les 6h | Horaire |

### Variables couverture nuageuse dans l'API Ensemble

- `cloud_cover` (total, instantané, %)
- `cloud_cover_low` (%)
- `cloud_cover_mid` (%)
- `cloud_cover_high` (%)

### Utilisation pour les probabilités

L'API retourne les données pour **chaque membre d'ensemble séparément**. L'utilisateur doit calculer les probabilités lui-même à partir de la dispersion des membres. Par exemple, pour estimer "probabilité de couverture nuageuse > 50%", compter combien des 51 membres IFS prédisent cloud_cover > 50 à chaque pas de temps.

L'API ne fournit pas de percentiles de probabilité pré-calculés pour la couverture nuageuse.

### Exemple d'appel API Ensemble

```
https://api.open-meteo.com/v1/ensemble?latitude=48.85&longitude=2.35&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&models=ecmwf_ifs025
```

---

## 10. Paramètre `models` et requêtes multi-modèle

### Utiliser plusieurs modèles en un seul appel

On peut demander les données de plusieurs modèles simultanément en fournissant plusieurs valeurs :

```
https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&hourly=cloud_cover&models=ecmwf_ifs,icon_seamless,gfs_seamless,meteofrance_seamless
```

La réponse contiendra des tableaux séparés pour chaque modèle, typiquement préfixés par le nom du modèle.

### Liste complète des valeurs de modèle connues par endpoint

**Via `/v1/forecast` (endpoint général) :**
- `best_match` (défaut)
- `icon_seamless`, `icon_global`, `icon_eu`, `icon_d2`
- `gfs_seamless`, `gfs_global`, `hrrr_conus`
- `meteofrance_seamless`, `meteofrance_arpege_seamless`, `meteofrance_arome_france`, `meteofrance_arome_france_hd`, `meteofrance_arpege_world`, `meteofrance_arpege_europe`
- `ecmwf_ifs`, `ecmwf_ifs025`, `ecmwf_aifs025`
- `nbm_conus`, `nam_conus`
- `gfs_graphcast`, `aigfs`, `hgefs`

**Via `/v1/ecmwf` :**
- `ecmwf_ifs`, `ecmwf_ifs025`, `ecmwf_aifs025`

**Via `/v1/meteofrance` :**
- `meteofrance_seamless`, `meteofrance_arpege_seamless`, `meteofrance_arpege_world`, `meteofrance_arpege_europe`, `meteofrance_arome_france`, `meteofrance_arome_france_hd`

**Via `/v1/dwd-icon` :**
- `icon_seamless`, `icon_global`, `icon_eu`, `icon_d2`

**Via `/v1/gfs` :**
- `gfs_seamless`, `gfs_global`, `hrrr_conus`, `nbm_conus`, `nam_conus`, `gfs_graphcast`, `aigfs`, `hgefs`

### Multi-locations

Jusqu'à 1000 localisations en une seule requête :

```
https://api.open-meteo.com/v1/forecast?latitude=48.85,45.76&longitude=2.35,4.83&hourly=cloud_cover
```

---

## 11. API historique (vérification)

### Endpoint

```
https://api.open-meteo.com/v1/archive
```

### Jeux de données de réanalyse disponibles

| Jeu de données | Résolution | Temporel | Période | Couverture nuageuse ? |
|---------------|------------|----------|---------|----------------------|
| ERA5 | 0.25° (~25 km) | Horaire | 1940 à aujourd'hui | Oui |
| ERA5-Land | 0.1° (~11 km) | Horaire | 1950 à aujourd'hui | Oui |
| ECMWF IFS (réanalyse) | 9 km | Horaire | 2017 à aujourd'hui | Oui |
| CERRA | 5 km | Horaire | 1985 à juin 2021 | Oui |
| ERA5-Ensemble | 0.5° (~55 km) | 3h | 1940 à aujourd'hui | Oui |

### Variables couverture nuageuse

- `cloud_cover` (total, %)
- `cloud_cover_low` (jusqu'à 2 km — **⚠️ seuil différent de l'API prévision**)
- `cloud_cover_mid` (2–6 km — **⚠️ différent des 3–8 km de l'API prévision**)
- `cloud_cover_high` (au-dessus de 6 km — **⚠️ différent des 8+ km de l'API prévision**)

### Utilisation pour la vérification

L'API historique peut servir à vérifier la précision des prévisions en comparant la couverture nuageuse prédite avec la "vérité" de réanalyse pour des dates passées. L'API Historical Forecast (`/v1/historical-forecast`) conserve les runs de modèle passés pour comparaison.

### Exemple d'appel API

```
https://api.open-meteo.com/v1/archive?latitude=48.85&longitude=2.35&start_date=2025-01-01&end_date=2025-01-31&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high
```

---

## 12. API Previous Runs

### Endpoint

```
https://api.open-meteo.com/v1/forecast  (avec past_days ou paramètres de runs précédents)
```

Documentation dédiée : `https://open-meteo.com/en/docs/previous-runs-api`

### Objectif

Accéder aux prévisions des **runs de modèle précédents** pour comparer l'évolution des prédictions dans le temps. Répond à la question "que prédisait la prévision d'hier pour aujourd'hui ?"

### Structure

- **Jour 0 :** Dernière prévision (la plus proche des mesures réelles)
- **Jour 1 :** Prévision d'il y a 24 heures
- **Jour 2 :** Prévision d'il y a 48 heures
- Etc.

### Disponibilité des données

La collecte a commencé en janvier 2024 pour la plupart des modèles. Les données de température GFS remontent à mars 2021 ; les modèles JMA depuis 2018.

---

## 13. Latence des données et pipeline de mise à jour

### API de métadonnées des mises à jour de modèles

Open-Meteo expose des métadonnées sur les mises à jour de modèles via la page de statut :

Timestamps clés par modèle :
1. **`last_run_initialisation_time`** — quand le run du modèle a démarré (ex : 00Z, 06Z)
2. **`last_run_modification_time`** — quand Open-Meteo a fini de télécharger et convertir les données
3. **`last_run_availability_time`** — quand les données sont devenues accessibles sur les serveurs API
4. **`temporal_resolution_seconds`** — granularité native des données
5. **`update_interval_seconds`** — intervalle attendu entre les mises à jour

### Latences typiques

| Modèle | Délai typique après l'heure d'init | Notes |
|--------|-------------------------------------|-------|
| DWD ICON-D2 | ~1–2 heures | Les variables de vent en altitude peuvent être jusqu'à 1h plus tard |
| DWD ICON-EU | ~2–3 heures | |
| DWD ICON Global | ~3–4 heures | |
| ECMWF IFS (temps réel) | ~5–6 heures | L'open-data ajoute ~2h de délai vs temps réel |
| ECMWF AIFS | ~5h45 après init | |
| Météo-France AROME | ~2–3 heures | |
| Météo-France ARPEGE | ~3–4 heures | |
| UK Met Office | ~4+ heures de délai | Délai de 4h intégré dans la distribution open data |
| NOAA GFS | ~3–4 heures | |
| NOAA HRRR | ~1 heure | Rafraîchissement rapide |

**Important :** Open-Meteo utilise des serveurs distribués géographiquement avec une consistance éventuelle. La documentation recommande d'**attendre 10 minutes après l'heure de disponibilité** pour s'assurer que tous les serveurs API ont les dernières données. Les serveurs en jaune sur la page de statut ont >20 minutes de retard ; en rouge, plusieurs mises à jour manquées.

### Page de statut

```
https://open-meteo.com/en/docs/model-updates
```

---

## 14. Limites de taux et politique d'usage

### Tier gratuit (non-commercial)

| Métrique | Limite |
|----------|--------|
| Par minute | 600 appels |
| Par heure | 5 000 appels |
| Par jour | 10 000 appels |
| Par mois | 300 000 appels |

**Pas d'enforcement strict actuellement** — fonctionne sur le principe du fair-use. Les requêtes excessives (milliers par minute) peuvent recevoir des réponses HTTP 429. Aucune clé API requise.

### Tiers payants

| Tier | Appels mensuels | Prix |
|------|----------------|------|
| Standard | 1 000 000 | Payant |
| Professional | 5 000 000 | Payant |
| Enterprise | 50 000 000+ | Sur mesure |

### Comptage des appels API

Les requêtes sont comptées de manière fractionnaire : les requêtes couvrant >10 variables ou >2 semaines de durée comptent comme plusieurs appels. Notifications à 80%, 90% et 100% d'utilisation.

### Définition non-commercial

Autorisé : sites web privés/à but non lucratif sans publicité/abonnements, domotique personnelle, recherche publique dans des institutions publiques, contenu éducatif.
Interdit sur le tier gratuit : sites web/applications avec abonnements ou publicité, produits commerciaux, recherche commerciale.

---

## 15. Breaking change : renommage des paramètres

**⚠️ Note critique pour le codebase AstroGuard :** Le code actuel dans `/root/AstroGuard/web-react/src/utils/api.js` utilise les **anciens noms de paramètres** :

```
cloudcover, cloudcover_low, cloudcover_mid, cloudcover_high, relativehumidity_2m, windspeed_10m
```

Open-Meteo a introduit un **breaking change** (documenté dans GitHub PR #543) qui a renommé toutes les variables pour utiliser des underscores :

| Ancien | Nouveau |
|--------|---------|
| `cloudcover` | `cloud_cover` |
| `cloudcover_low` | `cloud_cover_low` |
| `cloudcover_mid` | `cloud_cover_mid` |
| `cloudcover_high` | `cloud_cover_high` |
| `relativehumidity_2m` | `relative_humidity_2m` |
| `windspeed_10m` | `wind_speed_10m` |

Les anciens noms peuvent encore fonctionner comme alias pour la rétrocompatibilité, mais le nouveau code devrait utiliser les versions avec underscore. Les clés JSON de la réponse utiliseront aussi les nouveaux noms.

---

## 16. Quirks et limitations connus

### Couverture nuageuse

1. **AROME ne fournit que la couverture nuageuse totale.** Low/mid/high ne sont PAS disponibles. Pour le breakdown par couche en France, il faut utiliser ARPEGE (résolution inférieure) ou un autre modèle.

2. **La couverture nuageuse aux niveaux de pression est dérivée, pas native.** Les variables `cloud_cover_{level}hPa` sont approximées à partir de l'humidité relative, pas des sorties modèle natives. Elles peuvent être en désaccord avec les valeurs agrégées low/mid/high.

3. **Niveaux de pression sous la surface.** En altitude, les niveaux de pression les plus bas (1000 hPa, 975 hPa) peuvent être sous le sol. La couverture nuageuse dérivée de l'humidité à ces niveaux peut montrer 100% à tort, gonflant `cloud_cover_low`.

4. **Définitions d'altitude incohérentes.** L'API prévision dit nuages bas = "up to 3 km", mais l'API historique dit "up to 2 km". ECMWF utilise en interne des coordonnées sigma donnant ~1800 m comme frontière bas/moyen. Les comparaisons entre endpoints nécessitent cette conscience.

5. **La couverture nuageuse est instantanée.** Contrairement aux précipitations (qui sont une somme sur la période précédente), la couverture nuageuse représente la valeur à l'instant du timestamp.

6. **Les rafales ECMWF utilisent une fenêtre de 3h.** Contrairement aux autres endpoints où `wind_gusts_10m` est le maximum de l'heure précédente, ECMWF utilise une fenêtre d'accumulation de 3 heures.

7. **Artefacts d'interpolation temporelle.** Après 78 heures (ICON) ou 90 heures (ECMWF IFS), les données natives passent de l'horaire au 3-horaire. Open-Meteo interpole à l'horaire, mais la couverture nuageuse (étant discontinue) peut montrer un lissage artificiel à ces points de couture.

8. **La couverture nuageuse à 15 minutes n'est pas disponible.** Malgré la résolution temporelle de 15 min d'ICON-D2, la couverture nuageuse n'est pas parmi les variables 15 min. Seules les précipitations, la neige, le rayonnement solaire et la foudre sont disponibles à 15 min.

9. **Transitions du modèle best-match.** Quand l'algorithme best-match change de modèle à différentes heures de prévision, la température et la couverture nuageuse peuvent montrer des sauts discontinus au point de transition.

10. **Sous-estimation des nuages peu profonds dans AROME.** La littérature académique identifie une faiblesse connue dans la paramétrisation des nuages peu profonds d'AROME, particulièrement pour les stratocumulus et petits cumulus.

---

## 17. Tableau comparatif de synthèse

| Caractéristique | `/v1/forecast` (Best Match) | `/v1/meteofrance` (AROME/ARPEGE) | `/v1/ecmwf` (IFS) | `/v1/dwd-icon` (ICON) |
|----------------|----------------------------|-----------------------------------|--------------------|----------------------|
| **Meilleure résolution** | 1.5–25 km (variable) | 1.5 km (AROME HD) | 9 km (IFS HRES) | 2 km (ICON-D2) |
| **Cloud cover total** | Oui | Oui | Oui | Oui |
| **Cloud cover low/mid/high** | Oui | Uniquement ARPEGE, PAS AROME | Oui | Oui (natif) |
| **Cloud cover niveaux pression** | Oui | Oui (29 niveaux) | Oui (13 niveaux) | Oui (19 niveaux) |
| **Portée de prévision** | Jusqu'à 16 jours | 42h (AROME) / 4j (ARPEGE) | 10–15 jours | 2j (D2) / 7.5j (Global) |
| **Fréquence de mise à jour** | 1–6 heures | 3h (AROME) / 6h (ARPEGE) | Toutes les 6h | 3h (EU/D2) / 6h (Global) |
| **Couverture nuageuse native ?** | Dépend du modèle | Non (approx. humidité relative) | Oui (pronostique IFS) | Oui (natif ICON) |
| **Données 15 min** | Non | Non | Non | Non |
| **Fenêtre rafales de vent** | 1 heure | 1 heure | **3 heures** | 1 heure |

---

## 18. Sources

- [Open-Meteo Documentation (principal)](https://open-meteo.com/en/docs)
- [Open-Meteo Meteo-France API](https://open-meteo.com/en/docs/meteofrance-api)
- [Open-Meteo ECMWF API](https://open-meteo.com/en/docs/ecmwf-api)
- [Open-Meteo DWD ICON API](https://open-meteo.com/en/docs/dwd-api)
- [Open-Meteo GFS & HRRR API](https://open-meteo.com/en/docs/gfs-api)
- [Open-Meteo Ensemble API](https://open-meteo.com/en/docs/ensemble-api)
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [Open-Meteo Previous Runs API](https://open-meteo.com/en/docs/previous-runs-api)
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing)
- [Open-Meteo Terms of Service](https://open-meteo.com/en/terms)
- [Open-Meteo Model Updates / Status](https://open-meteo.com/en/docs/model-updates)
- [Open-Meteo Features](https://open-meteo.com/en/features)
- [Best weather models in one open-source API (Substack)](https://openmeteo.substack.com/p/best-weather-models-in-one-open-source)
- [GitHub Issue #214 : Show which weather model is used for best_match](https://github.com/open-meteo/open-meteo/issues/214)
- [GitHub Issue #416 : DWD ICON cloud cover from model levels](https://github.com/open-meteo/open-meteo/issues/416)
- [GitHub PR #543 : Breaking change — variable renaming](https://github.com/open-meteo/open-meteo/pull/543)
- [ECMWF : How are low, medium and high cloud cover defined?](https://confluence.ecmwf.int/pages/viewpage.action?pageId=111155326)
- [ECMWF IFS Documentation](https://www.ecmwf.int/en/forecasts/documentation-and-support/changes-ecmwf-model)
- [Integrated Forecast System — Wikipedia](https://en.wikipedia.org/wiki/Integrated_Forecast_System)
- [Global Forecast System — Wikipedia](https://en.wikipedia.org/wiki/Global_Forecast_System)
- [AROME — CNRM (Meteo-France)](https://umr-cnrm.fr/spip.php?amp=&article120=&lang=en)
- [WMO International Cloud Atlas — Levels](https://cloudatlas.wmo.int/en/some-useful-concepts-levels.html)
- [Open-Meteo Open Data on AWS (GitHub)](https://github.com/open-meteo/open-data)
