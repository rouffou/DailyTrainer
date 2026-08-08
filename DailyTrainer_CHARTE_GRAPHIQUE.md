# DailyTrainer — Charte graphique

> Identité visuelle de l'application. Comme pour la doctrine technique, les couleurs sémantiques (macros, statuts AJR) sont **fixes** : on ne réinvente pas une couleur pour un nouvel écran, on réutilise le token existant.

---

## 1. Positionnement visuel

Application de suivi nutritionnel : le ton doit rester **sain, précis, motivant** — pas clinique/froid comme une appli médicale, pas criard comme une appli de régime marketing agressif. Palette inspirée du végétal (vert) avec une touche d'énergie (orange), typographie neutre et lisible pour prioriser la donnée chiffrée.

---

## 2. Couleurs

### 2.1 Couleur primaire — vert santé

| Token              | Hex       | Usage                                                             |
| ------------------ | --------- | ----------------------------------------------------------------- |
| `--dt-primary-50`  | `#E6F5EF` | Fonds de badges, survol léger                                     |
| `--dt-primary-100` | `#C0E8D8` | Fonds de cartes actives                                           |
| `--dt-primary-300` | `#5FBE94` | Éléments décoratifs, graphiques                                   |
| `--dt-primary-500` | `#1F7A5C` | **Couleur de marque.** Logo, liens, boutons primaires, total kcal |
| `--dt-primary-700` | `#145A43` | Hover/active des boutons primaires                                |
| `--dt-primary-900` | `#0A3327` | Texte sur fond primary-50/100                                     |

### 2.2 Couleur accent — orange énergie

Réservée aux call-to-action secondaires et à tout ce qui évoque l'énergie/les calories brûlées (section dépense calorifique).

| Token             | Hex       | Usage                            |
| ----------------- | --------- | -------------------------------- |
| `--dt-accent-100` | `#FDE3D6` | Fond badge                       |
| `--dt-accent-500` | `#F2723C` | CTA secondaire, icône "activité" |
| `--dt-accent-700` | `#C24B1C` | Hover                            |

### 2.3 Neutres

| Token           | Hex       | Usage                             |
| --------------- | --------- | --------------------------------- |
| `--dt-gray-50`  | `#FAFAF8` | Fond de page                      |
| `--dt-gray-100` | `#F0EFEA` | Fond de carte                     |
| `--dt-gray-300` | `#D5D3C8` | Bordures                          |
| `--dt-gray-500` | `#8C8A80` | Texte tertiaire, icônes inactives |
| `--dt-gray-700` | `#4A4944` | Texte secondaire                  |
| `--dt-gray-900` | `#232220` | Texte principal                   |

### 2.4 Couleurs sémantiques — macronutriments **[fixes]**

Ces couleurs sont utilisées partout où un macro apparaît (tableaux, graphiques, badges, légendes) — jamais réassignées ailleurs.

| Nutriment        | Hex       | Token                       |
| ---------------- | --------- | --------------------------- |
| Calories (total) | `#1F7A5C` | `--dt-kcal` (= primary-500) |
| Protéines        | `#3D7DD8` | `--dt-protein`              |
| Glucides         | `#E8A730` | `--dt-carbs`                |
| Lipides          | `#8B5FBF` | `--dt-fat`                  |
| Fibres           | `#1D9E8F` | `--dt-fiber`                |

### 2.5 Micronutriments

Deux teintes discrètes pour ne pas surcharger les tableaux de micronutriments (nombreuses lignes) :

| Catégorie | Hex       | Token          |
| --------- | --------- | -------------- |
| Vitamines | `#5AA9E6` | `--dt-vitamin` |
| Minéraux  | `#B9754A` | `--dt-mineral` |

### 2.6 Statuts AJR **[fixes]**

| Statut          | Hex       | Token                | Règle                                                     |
| --------------- | --------- | -------------------- | --------------------------------------------------------- |
| Sous l'objectif | `#D5D3C8` | `--dt-status-under`  | < 80 % de l'AJR                                           |
| Atteint         | `#2E9E5B` | `--dt-status-ok`     | 80–110 % de l'AJR                                         |
| Attention       | `#E8A730` | `--dt-status-warn`   | 110–150 %, ou en approche d'un plafond (ex: sodium)       |
| Dépassé         | `#D64545` | `--dt-status-danger` | > 150 % d'un objectif, ou plafond dépassé (sodium, sucre) |

La couleur n'est jamais le seul indicateur : toujours coupler à une icône ou un texte (`% AJR` affiché) pour l'accessibilité.

### 2.7 Contraste

Tout texte sur fond coloré respecte **WCAG AA (4.5:1 minimum)**. Sur un fond `-500`/`-700`, texte blanc. Sur un fond `-50`/`-100`, texte `-900` de la même famille. Jamais de gris générique ou de noir pur sur une couleur de marque.

---

## 3. Typographie

**Police unique : Inter** (Google Fonts, gratuite, excellente lisibilité des chiffres — critère clé pour une app de données nutritionnelles). Un seul fichier de police à charger, pas de police d'appoint pour les titres.

| Usage                                  | Taille | Graisse                                                                                     |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Titre d'écran (ex: "Ma journée")       | 28px   | 700                                                                                         |
| Titre de section (ex: "Repas de midi") | 18px   | 600                                                                                         |
| Corps de texte                         | 15px   | 400                                                                                         |
| Libellé secondaire / méta              | 13px   | 400–500                                                                                     |
| Chiffres en tableau                    | 14px   | 500, `font-variant-numeric: tabular-nums` **obligatoire** (aligne les colonnes de chiffres) |

Échelle : 12 / 13 / 15 / 18 / 22 / 28 / 36px. Ne pas improviser une taille hors échelle.

---

## 4. Espacement & grille

Base 8px, jamais de valeur arbitraire (`13px`, `21px`... interdits) :

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

---

## 5. Rayons & élévation

- Cartes : `12px`
- Boutons, champs, badges rectangulaires : `8px`
- Pills/tags (macro, statut) : `999px` (full)
- Pas d'ombre portée décorative. Une seule ombre légère tolérée pour les éléments flottants (menu, popover) : `0 2px 8px rgba(0,0,0,0.08)`. Le reste se distingue par bordure `1px solid --dt-gray-300`, pas par ombre.

---

## 6. Iconographie

**Tabler Icons** (outline uniquement, jamais la variante "filled"), stroke 1.5–2px, tailles 20px (inline) / 24px (décoratif). Icônes clés : `checkbox`/`leaf` (marque), `flame` (calories), `chart-bar` (macros), `apple` (aliment), `plus` (ajout), `trash` (suppression), `chevron-down`, `calendar`.

---

## 7. Logo

**Wordmark** : "DailyTrainer" en Inter 700, couleur `--dt-primary-500`, minuscule après la majuscule initiale de chaque mot (pas de tout-capitales).

**Mark** : cercle plein `--dt-primary-500` avec une icône blanche centrée (coche/feuille) — symbolise à la fois la validation du suivi quotidien et le végétal/santé. Utilisé seul en favicon/icône d'app, toujours accompagné du wordmark en usage horizontal (header, écran de connexion).

Zone de protection minimale autour du logo : hauteur du "D" de DailyTrainer, sur tous les côtés. Pas de déformation, pas de recoloration hors palette.

---

## 8. Composants clés

- **Boutons primaires** : fond `--dt-primary-500`, texte blanc, `8px` radius, hover `--dt-primary-700`
- **Boutons secondaires** : fond transparent, bordure `1px solid --dt-primary-500`, texte `--dt-primary-500`
- **Boutons destructeurs** : bordure et texte `--dt-status-danger`, jamais de fond plein sauf confirmation modale
- **Badges macro** : fond pastel de la couleur du macro (ex: fond `--dt-protein` à 10-15% d'opacité ou son équivalent -50), texte dans la teinte foncée correspondante, forme pill
- **Barres de progression AJR** : fond `--dt-gray-300`, remplissage dans la couleur de statut correspondante (section 2.6)
- **Tableau récapitulatif journalier** : lignes zébrées légères (`--dt-gray-50`/blanc), chiffres alignés à droite en tabular-nums, couleur du texte du nutriment = sa couleur sémantique en version foncée (texte, pas fond)

---

## 9. Mode sombre

Les tokens sémantiques (macros, statuts) restent les mêmes teintes mais désaturées de ~10% pour éviter l'éblouissement sur fond sombre. Structure :

| Token clair                  | Équivalent sombre                                            |
| ---------------------------- | ------------------------------------------------------------ |
| `--dt-gray-50` (fond page)   | `#1C1B19`                                                    |
| `--dt-gray-100` (fond carte) | `#2A2926`                                                    |
| `--dt-gray-900` (texte)      | `#F0EFEA`                                                    |
| `--dt-primary-500`           | inchangé (déjà assez saturé pour contraster sur fond sombre) |

Implémentation : variables CSS déclarées sur `:root` et surchargées sous `[data-theme="dark"]`, jamais de couleur en dur dans les composants Angular (cf. section 6 de la doctrine technique — pas de `any`, et ici : pas de hex en dur dans un `.ts`/`.html`, toujours via variable CSS).

---

## 10. Règles d'usage **[non négociables]**

1. Une couleur de macro ou de statut AJR ne change jamais de sens d'un écran à l'autre.
2. Aucune couleur hors de cette palette n'est introduite sans mise à jour de ce document.
3. Le vert primaire n'est jamais utilisé pour un état d'erreur, l'orange accent n'est jamais utilisé pour un état de succès.
4. Tabular-nums obligatoire sur toute donnée chiffrée en colonne.
5. Le logo mark ne s'utilise jamais recoloré, étiré, ou sur un fond qui casse le contraste.
