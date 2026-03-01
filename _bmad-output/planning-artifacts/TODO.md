# TODO — ForecastTable Cloud Block Refactor

> Ref UX : `_bmad-output/planning-artifacts/ux-forecast-table-schema.md`

---

## Task 1 — Deplacer la colonne Total a gauche

**Fichiers** : `DaySection.jsx`, `DataRow.jsx`

**Description** :
Deplacer la colonne Total de sa position actuelle (apres Haut, col 6) vers la position 3 (apres H, avant Bas). Total doit etre collee au bloc fixe gauche (Score + Heure), sans gap ni arrondi.

**Changements** :
- `DaySection.jsx` : reordonner `SUB_HEADERS` pour placer `Total` en position 3
- `DaySection.jsx` : mettre a jour la ligne `source-header` — Total devient une cellule vide (colspan=1) avant le groupe OpenMeteo cloud (colspan=3)
- `DataRow.jsx` : deplacer le `<td>` de `clouds` (Total) juste apres le `<td class="hour">`

**Acceptance Criteria** :
- [ ] L'ordre des colonnes affiche est : ✓ | H | Total | Bas | Moy | Haut | Humid. | Vent | Seeing | Transp. | 🌙
- [ ] La ligne `source-header` montre une cellule vide sous Total
- [ ] Le `source-header` OpenMeteo cloud a un colspan=3 (Bas Moy Haut seulement)
- [ ] La heat-map de Total fonctionne toujours (`heatCell(tCloud(clouds), night)`)
- [ ] Le score (colonne ✓) utilise toujours la valeur `clouds` (Total) pour ses seuils
- [ ] Aucune regression sur les autres colonnes

---

## Task 2 — Retirer le separateur de Bas, ajouter un separateur sur Total

**Fichiers** : `DaySection.jsx`, `DataRow.jsx`

**Description** :
Actuellement Bas porte la classe `sep` (bordure gauche). Comme Total est maintenant a gauche des blocs cloud, c'est Total qui doit porter le separateur pour marquer la frontiere entre le bloc fixe gauche et la zone cloud. Bas ne doit plus avoir de `sep` car il sera dans le bloc flottant.

**Changements** :
- `DaySection.jsx` : dans `SUB_HEADERS`, mettre `sep: true` sur Total, `sep: false` sur Bas
- `DataRow.jsx` : ajouter `className="sep"` sur le `<td>` Total, retirer `className="sep"` de Bas

**Acceptance Criteria** :
- [ ] Total a une bordure gauche (`1px solid #1e1e38`)
- [ ] Bas n'a plus de bordure gauche
- [ ] Visuellement, le separateur vertical est entre H et Total (pas entre Total et Bas)

---

## Task 3 — Bloc flottant cloud : gaps horizontaux

**Fichiers** : `DataRow.jsx`, `GlobalStyle.js`

**Description** :
Creer un espace horizontal transparent (gap) de chaque cote des colonnes Bas/Moy/Haut dans les lignes de donnees uniquement. Le gap laisse apparaitre le fond de page (`#0d0d18`). Les lignes d'en-tete (day-header, sub-header, source-header) ne sont PAS affectees.

**Approche suggeree** :
Ajouter une classe CSS aux `<td>` Bas et Haut dans `DataRow.jsx` pour appliquer un margin ou un padding transparent. Attention : les `<td>` ne supportent pas `margin` natif en CSS. Options :
- `border-left` / `border-right` transparent + epaisseur comme gap sur Bas et Haut
- Ou `padding-left` sur Bas + `padding-right` sur Haut avec fond transparent sur la zone de padding (`background-clip: padding-box`)
- Ou inserer des `<td>` vides de largeur fixe comme spacers (le plus simple avec une table HTML)

**Acceptance Criteria** :
- [ ] Un espace transparent visible entre la colonne Total et Bas (gap gauche)
- [ ] Un espace transparent visible entre Haut et Humid. (gap droite)
- [ ] Le fond de page (`#0d0d18`) est visible dans les gaps
- [ ] Les lignes d'en-tete (day-header, sub-header, source-header) restent en bande continue sans gap
- [ ] Le gap est present sur toutes les DataRow (nuit et jour)
- [ ] Le colspan du day-header est mis a jour si des td spacers sont ajoutes

---

## Task 4 — Bloc flottant cloud : gaps verticaux

**Fichiers** : `DataRow.jsx` ou `DaySection.jsx`, `GlobalStyle.js`

**Description** :
Creer un espace vertical transparent (gap) au-dessus de la premiere ligne de donnees et en-dessous de la derniere ligne de donnees, mais uniquement pour les cellules Bas/Moy/Haut. Les autres colonnes ne doivent pas avoir de gap vertical.

**Approche suggeree** :
- Identifier la premiere et la derniere `DataRow` dans chaque `DaySection`
- Appliquer un `padding-top` transparent sur les cellules Bas/Moy/Haut de la premiere ligne
- Appliquer un `padding-bottom` transparent sur les cellules Bas/Moy/Haut de la derniere ligne
- Ou : ajouter une `<tr>` spacer avec des `<td>` vides de hauteur fixe, les cellules cloud ayant un fond transparent et les autres gardant le fond normal

**Acceptance Criteria** :
- [ ] Un espace transparent visible entre la ligne source-header et la premiere ligne de donnees, uniquement sur les colonnes Bas/Moy/Haut
- [ ] Un espace transparent visible apres la derniere ligne de donnees, uniquement sur les colonnes Bas/Moy/Haut
- [ ] Les colonnes Score, Heure, Total, Humid., Vent, Seeing, Transp., Lune n'ont PAS de gap vertical
- [ ] Le fond de page (`#0d0d18`) est visible dans les gaps verticaux

---

## Task 5 — Bloc flottant cloud : bords arrondis

**Fichiers** : `DataRow.jsx`, `GlobalStyle.js`

**Description** :
Appliquer des coins arrondis (`border-radius`) sur les cellules Bas/Moy/Haut pour la premiere et la derniere ligne de donnees de chaque section jour.

**Regles de border-radius** :
- Premiere DataRow du jour :
  - Bas : `border-top-left-radius` (coin haut-gauche)
  - Haut : `border-top-right-radius` (coin haut-droite)
  - Moy : aucun arrondi
- Derniere DataRow du jour :
  - Bas : `border-bottom-left-radius` (coin bas-gauche)
  - Haut : `border-bottom-right-radius` (coin bas-droite)
  - Moy : aucun arrondi
- Toutes les autres DataRow : aucun arrondi

**Approche suggeree** :
- Passer un prop `isFirst` / `isLast` a `DataRow` depuis `DaySection`
- Appliquer le border-radius en inline style ou via des classes conditionnelles

**Acceptance Criteria** :
- [ ] Les 4 coins du bloc cloud sont arrondis (haut-gauche, haut-droite, bas-gauche, bas-droite)
- [ ] Seules la premiere et derniere ligne de donnees ont des coins arrondis
- [ ] Les lignes intermediaires n'ont aucun arrondi
- [ ] L'arrondi est visible uniquement sur les colonnes Bas et Haut (pas Moy)
- [ ] Aucune autre colonne du tableau n'est affectee
- [ ] Le border-radius est suffisant pour etre visible mais pas excessif (suggere : `6px`)

---

## Task 6 — Verification finale et nettoyage

**Fichiers** : tous les fichiers modifies

**Description** :
Verification complete du rendu apres toutes les taches precedentes.

**Acceptance Criteria** :
- [ ] Le layout correspond au schema UX section 2 (source unique)
- [ ] Les en-tetes (day-header, sub-header, source-header) sont en bande continue sans aucun gap ni arrondi
- [ ] Le bloc flottant cloud (Bas Moy Haut) est visuellement detache avec gaps sur les 4 cotes et coins arrondis
- [ ] Total est a gauche, colle au bloc fixe, hors du bloc flottant
- [ ] La heat-map fonctionne correctement sur toutes les colonnes
- [ ] Le score fonctionne toujours (base sur Total)
- [ ] Les lignes jour (opacity 0.5) et nuit sont correctes
- [ ] Le hover (`brightness(1.2)`) fonctionne sur toutes les lignes
- [ ] Le scroll spy (sidebar) fonctionne toujours
- [ ] Pas de regression visuelle sur les colonnes non modifiees
- [ ] Le colspan du day-header est correct (s'adapte au nombre total de colonnes)

---

## Ordre d'execution

```
Task 1 (deplacer Total)
  └→ Task 2 (separateurs)
       └→ Task 3 (gaps horizontaux)
            └→ Task 4 (gaps verticaux)
                 └→ Task 5 (bords arrondis)
                      └→ Task 6 (verification)
```

Les taches sont sequentielles : chacune depend de la precedente.
