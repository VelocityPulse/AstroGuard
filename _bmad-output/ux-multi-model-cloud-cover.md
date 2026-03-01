# UX Specification : Couverture nuageuse multi-modeles

> **Statut** : Valide — pret pour implementation
> **Date** : 2026-03-01
> **Cible** : AstroGuard (React + Vite) — `web-react/src/`

---

## 1. Objectif

AstroGuard utilise actuellement un appel unique a l'endpoint best-match d'Open-Meteo (`/v1/forecast` sans parametre `models`). Cet appel renvoie un seul jeu de donnees de couverture nuageuse dont l'origine est opaque pour l'utilisateur : il ne sait pas quel modele meteorologique a produit les chiffres, ni quelle est la resolution ou la fiabilite de la prevision.

**Le redesign remplace cet appel par un appel multi-modeles explicite** qui interroge simultanement 4 modeles meteorologiques. Chaque modele obtient son propre groupe de colonnes dans le tableau, permettant a l'astronome amateur de :

1. **Comparer** les previsions de plusieurs modeles independants pour une meme heure.
2. **Comprendre** la provenance et la fiabilite des donnees (resolution, portee, frequence de mise a jour).
3. **Distinguer** les couches nuageuses (basses, moyennes, hautes) par modele, quand elles sont disponibles.
4. **Etendre** la visibilite de J+8 a J+16 grace aux modeles globaux (ECMWF, GFS).

Le passage en multi-modeles implique egalement la migration des noms de parametres Open-Meteo (anciens noms sans underscore vers nouveaux noms avec underscore).

---

## 2. Section pedagogique (haut de page)

Une section dediee est affichee **au-dessus du tableau**, visible immediatement sans interaction. Ce n'est ni un tooltip, ni un accordeon repliable : c'est du texte lisible, present en permanence.

Chaque modele dispose de son propre paragraphe. L'ensemble est encadre visuellement (par exemple un `<section>` avec fond legerement distinct, type `#0c0c1a`, bords arrondis, padding genereux).

### Contenu textuel exact (en francais, a integrer tel quel dans le composant)

---

**AROME — Meteo-France**

AROME est le modele haute resolution de Meteo-France, specialise sur le territoire francais. Avec des mailles de 1,5 km, il peut detecter des structures nuageuses a l'echelle d'un quartier — c'est le zoom le plus precis que l'on puisse obtenir d'un modele meteorologique operationnel. En contrepartie, il ne fournit que la couverture nuageuse totale (pas de decomposition par couche basse/moyenne/haute). Sa portee est limitee a 42 heures (environ J+2), mais il est recalcule toutes les 3 heures avec des donnees radar fraiches. C'est le modele ideal pour repondre a la question « est-ce que je sors observer ce soir ? ». Point de vigilance : AROME a tendance a sous-estimer les nuages bas de type stratocumulus.

---

**ICON-EU — DWD (Service meteorologique allemand)**

ICON-EU est le modele regional europeen du DWD, le service meteorologique allemand. Ses mailles de 7 km offrent un bon compromis entre precision et couverture geographique. Il fournit nativement la couverture nuageuse decomposee en trois couches (basse, moyenne, haute), ce qui est precieux pour l'astronomie : un voile de cirrus en altitude n'a pas le meme impact qu'une couche de stratus basse et opaque. Sa portee va jusqu'a 5 jours (J+5), avec une mise a jour toutes les 3 heures. La couverture nuageuse est une sortie directe du modele (pas derivee de l'humidite), ce qui la rend fiable.

---

**ECMWF IFS — Centre europeen de prevision meteorologique**

L'IFS du Centre europeen (ECMWF) est largement considere comme le meilleur modele meteorologique global. Il utilise des mailles de 9 km et dispose de 137 niveaux atmospheriques verticaux, ce qui lui donne une representation tres fine de la structure nuageuse. Les couches basse, moyenne et haute sont disponibles nativement. Sa portee atteint 10 jours (J+10), ce qui en fait le modele ideal pour planifier une sortie d'observation en milieu de semaine prochaine. Attention : au-dela de 90 heures (environ J+4), les donnees passent d'horaires a tri-horaires et sont re-interpolees a l'heure par Open-Meteo — une mention « interpole » apparait alors dans le tableau.

---

**GFS — NOAA (Service meteorologique americain)**

Le GFS est le modele global de la NOAA americaine. Avec des mailles de 13 km, sa resolution est plus grossiere que les modeles europeens, mais il offre la portee la plus longue : jusqu'a 16 jours. Les couches nuageuses (basse, moyenne, haute) sont disponibles nativement. Au-dela de 120 heures (J+5), les donnees deviennent tri-horaires. La fiabilite des previsions se degrade sensiblement apres J+10. Le GFS est surtout utile comme « deuxieme avis » a comparer avec l'ECMWF sur les echeances lointaines : si les deux modeles convergent, la confiance augmente.

---

### Specifications techniques du composant

- **Composant** : Creer `ModelDescriptions.jsx` (ou integrer dans `Header.jsx` / un nouveau composant de page).
- **Position** : Immediatement apres le `<Header>`, avant le layout `Sidebar + Table`.
- **Style** : Fond `#0c0c1a`, bordure `1px solid #1e1e3a`, `border-radius: 12px`, padding `20px 24px`. Titre de section : "Les modeles meteorologiques" en `0.85rem`, uppercase, `letter-spacing: 0.06em`, couleur `#5c6bc0`.
- **Typographie paragraphes** : `0.8rem`, couleur `#9e9e9e`, `line-height: 1.6`. Nom du modele en gras, couleur `#c9d1e0`.
- **Layout** : Les 4 paragraphes empiles verticalement, separes par un `<hr>` discret (`border-color: #1a1a2e`).
- **Responsive** : Ce bloc prend toute la largeur disponible, avec un `max-width: 900px` et `margin: 0 auto`.

---

## 3. Structure du tableau

### 3.1 Colonnes (constantes, jamais modifiees dynamiquement)

Le tableau a **exactement** les colonnes suivantes, dans cet ordre. Elles ne disparaissent et n'apparaissent jamais. Quand un modele n'a pas de donnees pour un horizon donne, la cellule affiche `—`.

```
Score | Heure | gap | AROME | gap | ICON-EU B  M  H | gap | ECMWF B  M  H | gap | GFS B  M  H | gap | Humid Vent | gap | Seeing Transp. | gap | Lune
```

Correspondance technique (tableau `HEADERS` dans `ForecastTable.jsx`) :

| # | Label     | Type    | Notes |
|---|-----------|---------|-------|
| 0 | `✓`       | score   | Premiere colonne, `first: true` |
| 1 | `H`       | heure   | |
| 2 |           | spacer  | `cloud-gap` |
| 3 | `AROME`   | donnee  | Total seulement (1 colonne) |
| 4 |           | spacer  | `cloud-gap` |
| 5 | `B`       | donnee  | ICON-EU Bas |
| 6 | `M`       | donnee  | ICON-EU Moy |
| 7 | `H`       | donnee  | ICON-EU Haut |
| 8 |           | spacer  | `cloud-gap` |
| 9 | `B`       | donnee  | ECMWF Bas |
| 10 | `M`      | donnee  | ECMWF Moy |
| 11 | `H`      | donnee  | ECMWF Haut |
| 12 |          | spacer  | `cloud-gap` |
| 13 | `B`      | donnee  | GFS Bas |
| 14 | `M`      | donnee  | GFS Moy |
| 15 | `H`      | donnee  | GFS Haut |
| 16 |          | spacer  | `cloud-gap` |
| 17 | `Humid.` | donnee  | Humidite relative |
| 18 | `Vent`   | donnee  | Vitesse du vent |
| 19 |          | spacer  | `cloud-gap` |
| 20 | `Seeing` | donnee  | 7Timer |
| 21 | `Transp.`| donnee  | 7Timer |
| 22 |          | spacer  | `cloud-gap` |
| 23 | `🌙`    | donnee  | Illumination lunaire |

**Total : 24 colonnes** (dont 6 spacers).

### 3.2 En-tete de groupe (ligne de titre au-dessus des sous-colonnes)

Le `<thead>` comporte **2 lignes** :

**Ligne 1** — Titres de groupe avec `colspan` :

```
✓ | H | (gap) | AROME | (gap) | ICON-EU (colspan=3) | (gap) | ECMWF (colspan=3) | (gap) | GFS (colspan=3) | (gap) | (colspan=2) | (gap) | (colspan=2) | (gap) | 🌙
```

Les groupes sans label de titre (Humid/Vent, Seeing/Transp) n'affichent rien en ligne 1 (cellule vide avec colspan).

**Ligne 2** — Sous-colonnes :

```
✓ | H | (gap) | Total | (gap) | B  M  H | (gap) | B  M  H | (gap) | B  M  H | (gap) | Humid. Vent | (gap) | Seeing Transp. | (gap) | 🌙
```

### 3.3 Bloc source dans chaque en-tete de jour

Chaque section de jour (`DaySection.jsx`) affiche un **bloc d'information source** sous l'en-tete de jour. Ce bloc repete les metadonnees de chaque modele de maniere exhaustive.

**Structure du bloc source** (une ligne `<tr>` avec `colspan` adaptes) :

| Position | Contenu |
|----------|---------|
| Sous AROME | `AROME` / `1.5 km` / `J→J+2` / `màj 3h` |
| Sous ICON-EU | `ICON-EU` / `7 km` / `J→J+5` / `màj 3h` |
| Sous ECMWF | `ECMWF` / `9 km` / `J→J+10` / `màj 6h` |
| Sous GFS | `GFS` / `13 km` / `J→J+16` / `màj 6h` |
| Sous Seeing/Transp | `7Timer` / `~20 km` / `J→J+3` / `màj 6h` |

Chaque bloc modele contient **4 lignes de texte empilees** (nom, resolution, portee, frequence) dans une seule cellule `<td>` avec des `<br>` ou un mini-layout flex vertical.

**Ligne d'avertissement conditionnelle** : Si la date du jour se situe au-dela du seuil d'interpolation d'un modele, une 5eme ligne apparait dans le bloc source de ce modele :

- ECMWF : au-dela de 90h depuis le run courant → afficher `⚠ interpolé`
- GFS : au-dela de 120h depuis le run courant → afficher `⚠ interpolé`

La mention `⚠ interpolé` est en couleur `#ffd54f` (jaune d'avertissement).

**Pas de nom d'operateur** dans le bloc source (retire par decision utilisateur). Seuls le nom du modele, la resolution, la portee, la frequence et l'avertissement eventuel.

### 3.4 Style des cellules nuageuses

Chaque groupe de modele (AROME, ICON-EU, ECMWF, GFS) est visuellement un **panneau** (fond continu, bords arrondis) identique au systeme actuel :

- AROME : panneau solo (`panelSolo`, 1 colonne).
- ICON-EU, ECMWF, GFS : panneau triple (`panelL`, `panelI`, `panelR`, 3 colonnes).

La fonction `heatCell(tCloud(valeur), night)` existante s'applique a chaque cellule. La valeur `—` (pas de donnees) utilise un fond neutre (`background: transparent` ou `#090912`, couleur `#546e7a`).

---

## 4. Mockup ASCII de reference

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✓   H  ┃AROME┃  ICON-EU        ┃  ECMWF          ┃  GFS            ┃Humid Vent┃See. Trsp.┃ 🌙 ┃
┃        ┃     ┃  B    M    H    ┃  B    M    H    ┃  B    M    H    ┃          ┃          ┃    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                                                              ┃
┃ 📅 samedi-dimanche 1 mars 2026                                                                               ┃
┃                                                                                                              ┃
┃        ┃AROME┃  ICON-EU        ┃  ECMWF          ┃  GFS            ┃          ┃ 7Timer   ┃    ┃
┃        ┃1.5km┃  7 km           ┃  9 km           ┃  13 km          ┃          ┃ ~20 km   ┃    ┃
┃        ┃J→J+2┃  J→J+5          ┃  J→J+10         ┃  J→J+16         ┃          ┃ J→J+3    ┃    ┃
┃        ┃màj3h┃  màj 3h         ┃  màj 6h         ┃  màj 6h         ┃          ┃ màj 6h   ┃    ┃
┃                                                                                                              ┃
┃ ✅ 21h ┃  8% ┃  4%   2%  15%  ┃  5%   3%  12%  ┃  8%   5%  18%  ┃ 65%   8  ┃ 6/8  5/8 ┃15% ┃
┃ ✅ 22h ┃ 12% ┃  6%   4%  18%  ┃  8%   5%  15%  ┃ 10%   7%  22%  ┃ 68%  10  ┃ 6/8  5/8 ┃15% ┃
┃ ✅ 23h ┃  5% ┃  2%   1%  10%  ┃  3%   2%   8%  ┃  5%   3%  14%  ┃ 70%  12  ┃ 6/8  5/8 ┃15% ┃
┃ ✅ 00h ┃  3% ┃  1%   1%   8%  ┃  2%   1%   5%  ┃  4%   2%  12%  ┃ 72%   9  ┃ 7/8  6/8 ┃15% ┃
┃ · · ·  ┃     ┃                 ┃                 ┃                 ┃          ┃          ┃    ┃
┃                                                                                                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                                                              ┃
┃ 📅 mercredi-jeudi 5 mars 2026                                                                        J+4    ┃
┃                                                                                                              ┃
┃        ┃AROME┃  ICON-EU        ┃  ECMWF          ┃  GFS            ┃          ┃ 7Timer   ┃    ┃
┃        ┃1.5km┃  7 km           ┃  9 km           ┃  13 km          ┃          ┃ ~20 km   ┃    ┃
┃        ┃J→J+2┃  J→J+5          ┃  J→J+10         ┃  J→J+16         ┃          ┃ J→J+3    ┃    ┃
┃        ┃màj3h┃  màj 3h         ┃  màj 6h         ┃  màj 6h         ┃          ┃ màj 6h   ┃    ┃
┃                                                                                                              ┃
┃ ▲  21h ┃  —  ┃ 12%   8%  25%  ┃ 10%   6%  20%  ┃ 15%  10%  28%  ┃ 62%  13  ┃  —    —  ┃40% ┃
┃ ✅ 22h ┃  —  ┃  8%   5%  18%  ┃  6%   4%  15%  ┃ 10%   7%  22%  ┃ 65%  11  ┃  —    —  ┃40% ┃
┃ ✅ 23h ┃  —  ┃  5%   3%  12%  ┃  4%   2%  10%  ┃  8%   5%  18%  ┃ 68%  10  ┃  —    —  ┃40% ┃
┃ · · ·  ┃     ┃                 ┃                 ┃                 ┃          ┃          ┃    ┃
┃                                                                                                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                                                              ┃
┃ 📅 mardi-mercredi 11 mars 2026                                                                       J+10   ┃
┃                                                                                                              ┃
┃        ┃AROME┃  ICON-EU        ┃  ECMWF          ┃  GFS            ┃          ┃ 7Timer   ┃    ┃
┃        ┃1.5km┃  7 km           ┃  9 km           ┃  13 km          ┃          ┃ ~20 km   ┃    ┃
┃        ┃J→J+2┃  J→J+5          ┃  J→J+10         ┃  J→J+16         ┃          ┃ J→J+3    ┃    ┃
┃        ┃màj3h┃  màj 3h         ┃  màj 6h         ┃  màj 6h         ┃          ┃ màj 6h   ┃    ┃
┃        ┃     ┃                 ┃  ⚠ interpolé    ┃  ⚠ interpolé    ┃          ┃          ┃    ┃
┃                                                                                                              ┃
┃ 🔴21-0 ┃  —  ┃  —    —    —   ┃ 30%  25%  65%  ┃ 35%  28%  60%  ┃ 78%  14  ┃  —    —  ┃70% ┃
┃ ▲ 0-4h ┃  —  ┃  —    —    —   ┃ 15%  12%  40%  ┃ 18%  14%  38%  ┃ 72%  10  ┃  —    —  ┃70% ┃
┃ ✅4-6h ┃  —  ┃  —    —    —   ┃  8%   5%  25%  ┃ 10%   7%  22%  ┃ 68%   8  ┃  —    —  ┃70% ┃
┃                                                                                                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 5. Agregation temporelle

### 5.1 Regles

| Horizon           | Mode                     | Detail |
|-------------------|--------------------------|--------|
| J a J+5           | Horaire                  | 1 ligne par heure |
| J+5 a J+16        | Blocs de 3-4 heures      | Lignes agregees |

### 5.2 Blocs agreges pour les nuits (J+5 a J+16)

Les blocs sont definis par rapport aux heures de nuit astronomique :

| Bloc      | Heures couvertes | Signification |
|-----------|------------------|---------------|
| `21-00h`  | 21, 22, 23       | Debut de nuit |
| `00-04h`  | 00, 01, 02, 03   | Coeur de nuit |
| `04-06h`  | 04, 05           | Fin de nuit   |

Les heures de jour dans cette plage sont egalement agregees, mais avec le style `is-day` (comme actuellement).

### 5.3 Calcul de la valeur agregee

Pour chaque bloc, la valeur affichee est la **moyenne arithmetique** des valeurs horaires du modele pour les heures du bloc. Si toutes les valeurs du bloc sont `null` (modele hors portee), afficher `—`.

### 5.4 Indicateur visuel de granularite reduite

Les lignes agregees utilisent un style CSS distinct :
- Police legerement plus petite (`0.75rem` au lieu de `0.82rem`).
- Label d'heure au format plage (`21-0h`, `0-4h`, `4-6h`) au lieu de `21h`.
- Pas de changement de couleur de fond — la heatmap s'applique normalement sur la valeur moyenne.

### 5.5 Transition horaire/agrege

La transition se fait **par section de jour**. Si un jour tombe entierement dans la plage J+5 a J+16, toutes ses lignes sont agregees. La coupure se fait sur le jour calendaire, pas en milieu de journee.

---

## 6. Logique du score (colonne ✓)

### 6.1 Selection du modele de reference pour le score

Le score utilise **un seul modele** a la fois, par ordre de priorite :

1. **AROME** — si AROME a des donnees pour cette heure (`cloud_cover` non null) : utiliser la valeur `cloud_cover` d'AROME (couverture totale).
2. **ECMWF** — si AROME n'a pas de donnees : utiliser la valeur `cloud_cover` d'ECMWF (couverture totale, disponible directement dans la reponse API ou calculable comme `max(low, mid, high)`).

> Justification : AROME est le plus precis a court terme. ECMWF est le modele global le plus fiable.

### 6.2 Seuils (inchanges)

| Couverture totale | Score | Rendu |
|-------------------|-------|-------|
| 0-20%             | GO    | `✅`  |
| 21-50%            | MAYBE | `▲` (couleur `#ffd54f`) |
| 51-100%           | NO    | `🔴`  |
| Heure de jour     | —     | `·`   |

### 6.3 Score pour les lignes agregees

Pour les blocs agreges (J+5+), le score est calcule sur la **moyenne** des valeurs du modele de reference dans le bloc.

### 6.4 Constante de seuil

La constante `THR_CLOUD = 20` dans `DataRow.jsx` reste identique. La logique existante (`clouds <= THR_CLOUD`, `clouds <= 50`, `else`) est conservee — seule la source de la variable `clouds` change.

---

## 7. Colonnes non-nuages

### 7.1 Humidite et Vent

**Source : ECMWF IFS.**

Justification : ECMWF couvre J+10 (portee la plus longue parmi les modeles europeens), et ses donnees meteorologiques sont des sorties directes du modele. Utiliser un seul modele pour humidite/vent evite la confusion.

Les champs API correspondants :
- `relative_humidity_2m` (prefixe par `ecmwf_ifs_`)
- `wind_speed_10m` (prefixe par `ecmwf_ifs_`)

Pour les heures au-dela de la portee ECMWF (J+10 a J+16), basculer sur les donnees GFS :
- `relative_humidity_2m` (prefixe par `gfs_global_`)
- `wind_speed_10m` (prefixe par `gfs_global_`)

Si ni ECMWF ni GFS n'ont de donnees → afficher `—`.

### 7.2 Seeing et Transparence

**Source : 7Timer API (inchangee).**

Aucune modification de `fetch7timer()` ni de `build7timerMap()`. La portee de 7Timer est d'environ J+3. Au-dela, les cellules affichent deja `—` grace au mecanisme existant (`seeing > 0 ? ... : '—'`).

### 7.3 Lune

**Source : calcul cote client (inchange).**

`moonIllumination(date)` dans `astronomy.js` reste identique. Aucun changement.

---

## 8. Appel API

### 8.1 Appel Open-Meteo multi-modeles (REMPLACE l'appel actuel)

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,wind_speed_10m
  &daily=sunset,sunrise
  &timezone=Europe/Paris
  &forecast_days=16
  &models=meteofrance_arome_france_hd,icon_eu,ecmwf_ifs,gfs_global
```

**Changements par rapport a l'appel actuel :**

| Aspect | Avant | Apres |
|--------|-------|-------|
| Endpoint | `/v1/forecast` (best-match) | `/v1/forecast` + `models=...` |
| `forecast_days` | `8` | `16` |
| `models` | absent | `meteofrance_arome_france_hd,icon_eu,ecmwf_ifs,gfs_global` |
| Noms de champs hourly | `cloudcover`, `relativehumidity_2m`, `windspeed_10m` | `cloud_cover`, `relative_humidity_2m`, `wind_speed_10m` |

### 8.2 Structure de la reponse API

Quand `models` est specifie, Open-Meteo retourne les champs horaires **prefixes par le nom du modele** :

```json
{
  "hourly": {
    "time": ["2026-03-01T00:00", ...],

    "cloud_cover_meteofrance_arome_france_hd": [45, 32, null, ...],
    "cloud_cover_low_meteofrance_arome_france_hd": null,
    "cloud_cover_mid_meteofrance_arome_france_hd": null,
    "cloud_cover_high_meteofrance_arome_france_hd": null,

    "cloud_cover_icon_eu": [42, 35, ...],
    "cloud_cover_low_icon_eu": [10, 8, ...],
    "cloud_cover_mid_icon_eu": [15, 12, ...],
    "cloud_cover_high_icon_eu": [30, 25, ...],

    "cloud_cover_ecmwf_ifs": [40, 33, ...],
    "cloud_cover_low_ecmwf_ifs": [12, 10, ...],
    "cloud_cover_mid_ecmwf_ifs": [14, 11, ...],
    "cloud_cover_high_ecmwf_ifs": [28, 22, ...],

    "cloud_cover_gfs_global": [50, 40, ...],
    "cloud_cover_low_gfs_global": [15, 12, ...],
    "cloud_cover_mid_gfs_global": [18, 15, ...],
    "cloud_cover_high_gfs_global": [35, 30, ...],

    "relative_humidity_2m_ecmwf_ifs": [65, 68, ...],
    "wind_speed_10m_ecmwf_ifs": [8, 10, ...],
    "relative_humidity_2m_gfs_global": [62, 65, ...],
    "wind_speed_10m_gfs_global": [9, 11, ...]
  },
  "daily": {
    "time": ["2026-03-01", ...],
    "sunset": ["2026-03-01T18:32", ...],
    "sunrise": ["2026-03-01T07:15", ...]
  }
}
```

**Points importants :**
- `time` est un tableau unique partage par tous les modeles. Il couvre `forecast_days=16` jours.
- Les modeles a portee courte (AROME: 42h) auront des `null` pour les heures au-dela de leur portee.
- AROME ne fournit **pas** de `cloud_cover_low/mid/high` — ces champs seront soit absents, soit remplis de `null`. L'implementation doit gerer les deux cas.
- Le tableau `time` sera de longueur 16*24 = 384 entrees.

### 8.3 Appel 7Timer (inchange)

```
GET https://www.7timer.info/bin/api.pl
  ?lon={lon}
  &lat={lat}
  &product=astro
  &output=json
```

### 8.4 Prefetch dans index.html

Le script de prefetch dans `index.html` doit etre mis a jour pour correspondre au nouvel appel API :

```javascript
meteo: fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon
  +'&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,wind_speed_10m'
  +'&daily=sunset,sunrise&timezone=Europe/Paris&forecast_days=16'
  +'&models=meteofrance_arome_france_hd,icon_eu,ecmwf_ifs,gfs_global')
  .then(function(r){return r.json()})
```

---

## 9. Migration des noms de parametres

### 9.1 Correspondance ancien → nouveau

| Ancien (actuel dans le code) | Nouveau (Open-Meteo v2) |
|------------------------------|-------------------------|
| `cloudcover`                 | `cloud_cover`           |
| `cloudcover_low`             | `cloud_cover_low`       |
| `cloudcover_mid`             | `cloud_cover_mid`       |
| `cloudcover_high`            | `cloud_cover_high`      |
| `relativehumidity_2m`        | `relative_humidity_2m`  |
| `windspeed_10m`              | `wind_speed_10m`        |

### 9.2 Fichiers concernes par la migration de noms

1. **`utils/api.js`** — URL de l'appel `fetchOpenMeteo` (parametres `hourly=...`).
2. **`hooks/useWeatherData.js`** — Destructuration de `meteo.hourly` (ligne 28-29 actuelle).
3. **`index.html`** — URL de prefetch (parametres `hourly=...`).

### 9.3 Impact

Cette migration est une rupture : les anciens noms ne sont plus reconnus par Open-Meteo quand le parametre `models` est utilise. Il n'y a pas de retrocompatibilite a gerer — le code passe directement aux nouveaux noms.

---

## 10. Sidebar

### 10.1 Adaptation au multi-modeles

La sidebar affiche les **statistiques de nuit** (moyenne de couverture nuageuse pour chaque nuit). Actuellement, elle utilise les donnees best-match. Elle doit etre adaptee pour utiliser les donnees multi-modeles.

### 10.2 Source des statistiques de nuit

La sidebar utilise les memes regles de priorite que le score :

1. **Si AROME a des donnees** pour cette heure de nuit : utiliser `cloud_cover` d'AROME.
2. **Sinon** : utiliser `cloud_cover` d'ECMWF.
3. **Sinon** (au-dela de J+10) : utiliser `cloud_cover` de GFS.

Pour les couches (B, M, H) affichees dans les tags de la sidebar :
- Utiliser ECMWF comme source preferee (car il a des couches natives et la meilleure portee europeenne).
- Au-dela de J+10 : basculer sur GFS.
- Les tags affichent toujours B/M/H (jamais la valeur AROME qui n'a que le total).

### 10.3 Structure du `nightStats` (modifie)

L'objet `nightStats` dans `useWeatherData.js` change de structure :

```javascript
// Avant
nightStats[nightKey] = {
  total: 0,         // nombre d'heures
  sumClouds: 0,     // somme cloud_cover (best-match)
  sumL: 0,          // somme cloud_cover_low
  sumM: 0,          // somme cloud_cover_mid
  sumH: 0           // somme cloud_cover_high
};

// Apres
nightStats[nightKey] = {
  total: 0,         // nombre d'heures de nuit
  sumClouds: 0,     // somme cloud_cover (AROME si dispo, sinon ECMWF, sinon GFS)
  sumL: 0,          // somme cloud_cover_low (ECMWF si dispo, sinon GFS)
  sumM: 0,          // somme cloud_cover_mid (ECMWF si dispo, sinon GFS)
  sumH: 0           // somme cloud_cover_high (ECMWF si dispo, sinon GFS)
};
```

### 10.4 SidebarItem (changements mineurs)

Le composant `SidebarItem.jsx` n'a **pas besoin de modifications structurelles**. Il recoit deja `stats` avec `sumClouds`, `sumL`, `sumM`, `sumH`, `total`. Seule la source des donnees change (dans `useWeatherData.js`).

---

## 11. Fichiers impactes

### 11.1 Fichiers a modifier

| Fichier | Nature du changement | Complexite |
|---------|---------------------|------------|
| `web-react/src/utils/api.js` | Remplacer l'URL best-match par l'URL multi-modeles. Noms de parametres migres. | Faible |
| `web-react/src/hooks/useWeatherData.js` | Refonte majeure : parser la reponse multi-modeles, construire les objets `row` avec les 4 modeles, adapter le calcul de `nightStats`, implementer l'agregation temporelle (blocs J+5+). | Elevee |
| `web-react/src/components/ForecastTable.jsx` | Refonte de `HEADERS` (24 colonnes), ajout de la ligne de titres de groupe (`colspan`), adaptation du `<thead>` a 2 lignes. | Moyenne |
| `web-react/src/components/DaySection.jsx` | Refonte de `SUB_HEADERS`, refonte du bloc `source-header` (4 modeles + 7Timer avec metadonnees completes + avertissement d'interpolation conditionnel), adaptation du `colSpan` du `day-header`. | Elevee |
| `web-react/src/components/DataRow.jsx` | Ajout des cellules pour les 4 modeles (AROME total, ICON-EU B/M/H, ECMWF B/M/H, GFS B/M/H), logique du score modifiee (AROME prioritaire, fallback ECMWF), gestion du `—` pour les modeles hors portee. | Elevee |
| `web-react/index.html` | Mise a jour de l'URL de prefetch (parametres, noms, `forecast_days=16`, `models=...`). | Faible |

### 11.2 Fichiers a creer

| Fichier | Contenu |
|---------|---------|
| `web-react/src/components/ModelDescriptions.jsx` | Section pedagogique (4 paragraphes de modeles). Nouveau composant. |

### 11.3 Fichiers inchanges

| Fichier | Raison |
|---------|--------|
| `web-react/src/utils/colors.js` | Les fonctions `heatCell`, `tCloud`, `tHumid`, `tWind`, `tSeeing`, `tTransp` restent identiques. |
| `web-react/src/utils/astronomy.js` | `moonIllumination`, `isNight`, `buildSunMap` restent identiques. |
| `web-react/src/hooks/useLocation.js` | Aucun changement. |
| `web-react/src/hooks/useScrollSpy.js` | Aucun changement. |
| `web-react/src/components/Header.jsx` | Aucun changement (sauf si `ModelDescriptions` est integre dedans, mais recommande comme composant separe). |
| `web-react/src/components/LocationSearch.jsx` | Aucun changement. |
| `web-react/src/components/Sidebar.jsx` | Aucun changement structurel (recoit `nightStats` comme avant). |
| `web-react/src/components/SidebarItem.jsx` | Aucun changement structurel (interface `stats` identique). |
| `web-react/src/components/Loader.jsx` | Aucun changement. |

---

## 12. Annexe : structure de donnees des lignes (`row`)

### 12.1 Objet `row` actuel (a remplacer)

```javascript
{
  tStr: "2026-03-01T21:00",
  day: "2026-03-01",
  hour: 21,
  night: true,
  clouds: 45,        // best-match total
  cloudsLow: 10,     // best-match low
  cloudsMid: 15,     // best-match mid
  cloudsHigh: 30,    // best-match high
  humidity: 65,
  wind: 8,
  seeing: 6,
  transparency: 5
}
```

### 12.2 Objet `row` nouveau

```javascript
{
  tStr: "2026-03-01T21:00",
  day: "2026-03-01",
  hour: 21,               // ou label de bloc ("21-0h") pour les lignes agregees
  isAggregated: false,     // true pour les blocs J+5+
  blockLabel: null,        // "21-0h", "0-4h", "4-6h" (null si horaire)
  night: true,

  // Score (valeur pre-calculee pour la colonne ✓)
  scoreCloud: 45,          // AROME si dispo, sinon ECMWF cloud_cover

  // AROME (total uniquement)
  aromeTotal: 45,          // null si hors portee

  // ICON-EU (3 couches)
  iconLow: 10,             // null si hors portee
  iconMid: 15,
  iconHigh: 30,

  // ECMWF (3 couches)
  ecmwfLow: 12,            // null si hors portee
  ecmwfMid: 14,
  ecmwfHigh: 28,

  // GFS (3 couches)
  gfsLow: 15,              // null si hors portee
  gfsMid: 18,
  gfsHigh: 35,

  // Meteo (ECMWF pref, fallback GFS)
  humidity: 65,
  wind: 8,

  // 7Timer (inchange)
  seeing: 6,
  transparency: 5
}
```

### 12.3 Fonction utilitaire de formatage de cellule nuageuse

Pour eviter la repetition dans `DataRow.jsx`, creer une fonction utilitaire :

```javascript
function cloudCell(value, night, panelStyle) {
  if (value === null || value === undefined) {
    return (
      <td style={{ color: '#546e7a', background: '#090912', ...panelStyle }}>
        —
      </td>
    );
  }
  return (
    <td style={{ ...heatCell(tCloud(value), night), ...panelStyle }}>
      {value}%
    </td>
  );
}
```

---

## 13. Annexe : constantes des modeles

Pour centraliser les metadonnees des modeles, creer un objet de configuration reutilisable (par exemple dans un nouveau fichier `utils/models.js` ou directement dans `DaySection.jsx`) :

```javascript
export const MODELS = [
  {
    key: 'arome',
    apiPrefix: 'meteofrance_arome_france_hd',
    label: 'AROME',
    resolution: '1.5 km',
    range: 'J→J+2',
    updateFreq: 'màj 3h',
    maxHours: 42,
    hasLayers: false,       // seulement cloud_cover total
    interpolatedAfterH: null
  },
  {
    key: 'icon',
    apiPrefix: 'icon_eu',
    label: 'ICON-EU',
    resolution: '7 km',
    range: 'J→J+5',
    updateFreq: 'màj 3h',
    maxHours: 120,
    hasLayers: true,
    interpolatedAfterH: null
  },
  {
    key: 'ecmwf',
    apiPrefix: 'ecmwf_ifs',
    label: 'ECMWF',
    resolution: '9 km',
    range: 'J→J+10',
    updateFreq: 'màj 6h',
    maxHours: 240,
    hasLayers: true,
    interpolatedAfterH: 90
  },
  {
    key: 'gfs',
    apiPrefix: 'gfs_global',
    label: 'GFS',
    resolution: '13 km',
    range: 'J→J+16',
    updateFreq: 'màj 6h',
    maxHours: 384,
    hasLayers: true,
    interpolatedAfterH: 120
  }
];
```

Cette structure est utilisee par :
- `useWeatherData.js` — pour savoir quels champs extraire de la reponse API.
- `DaySection.jsx` — pour generer le bloc source.
- `DataRow.jsx` — pour determiner quels champs du `row` afficher.

---

## 14. Annexe : CSS additionnel

### 14.1 Nouvelles classes

```css
/* Ligne agregee (blocs 3-4h) */
.data-row.is-aggregated .hour {
  font-size: 0.75rem;
}

/* Avertissement d'interpolation */
.source-header .interpolation-warning {
  color: #ffd54f;
  font-size: 0.6rem;
  font-weight: 600;
}

/* Section pedagogique */
.model-descriptions {
  background: #0c0c1a;
  border: 1px solid #1e1e3a;
  border-radius: 12px;
  padding: 20px 24px;
  max-width: 900px;
  margin: 12px auto;
}

.model-descriptions h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5c6bc0;
  margin-bottom: 16px;
}

.model-descriptions .model-name {
  color: #c9d1e0;
  font-weight: 700;
}

.model-descriptions p {
  font-size: 0.8rem;
  color: #9e9e9e;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.model-descriptions hr {
  border: none;
  border-top: 1px solid #1a1a2e;
  margin: 12px 0;
}
```

### 14.2 Largeur du tableau

Le tableau passe de 15 colonnes (actuel) a 24 colonnes. La largeur `fit-content` dans `ForecastTable.jsx` (via styled-components) doit etre conservee — le tableau debordera lateralement et le scroll horizontal sera naturel.

Verifier que le conteneur `.main` a bien `overflow-x: auto` pour permettre le scroll horizontal sur petits ecrans.

---

## 15. Annexe : ordre d'implementation recommande

1. **`utils/models.js`** — Creer le fichier de constantes des modeles.
2. **`utils/api.js`** — Migrer l'appel API.
3. **`index.html`** — Mettre a jour le prefetch.
4. **`hooks/useWeatherData.js`** — Refonte du parsing et de la construction des rows. Tester avec `console.log` que les donnees arrivent correctement.
5. **`components/ForecastTable.jsx`** — Nouveau `HEADERS` avec 24 colonnes et 2 lignes de thead.
6. **`components/DaySection.jsx`** — Nouveau `SUB_HEADERS`, nouveau bloc source avec metadonnees.
7. **`components/DataRow.jsx`** — Nouvelles cellules pour les 4 modeles, nouvelle logique de score.
8. **`components/ModelDescriptions.jsx`** — Section pedagogique (peut etre fait en parallele).
9. **Integration dans le layout principal** — Ajouter `ModelDescriptions` dans `App.jsx` ou le composant racine.
10. **Tests visuels** — Verifier l'affichage sur differents horizons (J, J+3, J+6, J+12).
