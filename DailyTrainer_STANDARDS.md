# DailyTrainer — Doctrine technique
## Architecture modulaire, clean code, conventions Angular

> Ce document n'est pas une liste de suggestions. Toute PR qui viole une règle marquée **[BLOQUANT]** est rejetée sans discussion. Basé sur **Angular 22** (standalone par défaut, zoneless, signals, Signal Forms stables — juin 2026).

---

## 1. Principes fondateurs (non négociables)

1. **Un fichier = une responsabilité.** Si tu ne peux pas résumer ce que fait un fichier en une phrase sans "et", il est mal découpé.
2. **Aucune logique métier dans un composant.** Un composant orchestre l'affichage et délègue tout calcul/accès aux données à un service.
3. **Aucun accès Firestore en dehors de la couche `data-access`.** Ni dans un composant, ni dans un guard écrit à la va-vite.
4. **Le typage `any` est interdit.** Sans exception. `unknown` + narrowing si le type est réellement inconnu.
5. **Rien ne se merge sans test** sur la logique pure (calculs nutritionnels, agrégations, parsing).

---

## 2. Architecture modulaire

### 2.1 Arborescence imposée

```
src/app/
├── core/                       # Singletons, config, aucune UI
│   ├── models/                 # Interfaces TS pures (Food, Meal, DailyLog, NutrientProfile...)
│   ├── data-access/            # Services Firestore (1 service = 1 collection racine)
│   │   ├── food.repository.ts
│   │   ├── daily-log.repository.ts
│   │   └── meal.repository.ts
│   ├── domain/                 # Logique métier pure, zéro dépendance Angular/Firebase
│   │   ├── nutrition-calc.service.ts     # computeNutrients(), aggregateTotals()
│   │   ├── food-input-parser.ts          # parsing "100gr de bacon aldi"
│   │   └── targets.ts                    # DEFAULT_TARGETS, calcul BMR/TDEE
│   ├── auth/
│   └── firebase/                # providers @angular/fire, environment binding
├── features/
│   ├── day/                    # Écran "Ma journée"
│   │   ├── day.page.ts         # composant "smart" (page), seul point d'injection des services
│   │   └── components/         # composants "dumb" (présentation pure, @Input/@Output only)
│   │       ├── meal-card/
│   │       ├── nutrient-summary-table/
│   │       └── macro-chart/
│   ├── history/
│   └── food-search/
├── shared/                     # UI réutilisable inter-features, zéro logique métier
│   ├── ui/                     # boutons, cartes, tableaux génériques
│   └── pipes/
└── app.routes.ts
```

### 2.2 Règles de dépendance entre couches **[BLOQUANT]**

```
shared    → ne dépend de rien (sauf Angular/CDK)
core      → ne dépend jamais de features/ ni de shared/
features  → peuvent dépendre de core/ et shared/
features  → ne dépendent JAMAIS directement les unes des autres
```

Une feature qui a besoin d'une donnée d'une autre feature passe par `core` (service partagé ou state signal exposé dans `core`), jamais par un import direct `features/day/... → features/history/...`.

Ces règles sont **codifiées, pas juste documentées** : `eslint-plugin-boundaries` configuré dans `.eslintrc` avec les zones `core`, `shared`, `features`, et les règles d'import ci-dessus. Un import qui viole la règle casse le lint, pas juste la revue de code.

### 2.3 Pattern smart / dumb component **[BLOQUANT]**

- **Smart component** (suffixe `.page.ts`) : un seul par route, injecte les services (`core/data-access`, `core/domain`), possède les signals d'état, passe les données aux dumb components via `input()`.
- **Dumb component** : jamais d'injection de service Firestore, jamais d'appel HTTP. Uniquement `input()` / `output()`. Doit pouvoir être rendu dans un Storybook sans backend.

### 2.4 Repository pattern pour Firestore **[BLOQUANT]**

Un seul point d'entrée par collection racine (`FoodRepository`, `DailyLogRepository`, `MealRepository`). Interdiction d'appeler `collection()`, `doc()`, `getDocs()` etc. depuis un composant ou un service `domain/`. Le repository retourne des `Observable<T>` ou `Signal<T>` typés, jamais du `DocumentData` brut.

---

## 3. Conventions Angular (dictature)

Basées sur le style guide officiel Angular + les évolutions stables d'Angular 22.

| Sujet | Règle |
|---|---|
| Composants | **Standalone uniquement.** Aucun `NgModule` n'est créé, jamais. |
| Change detection | **Zoneless** (`provideZonelessChangeDetection()`). Zone.js n'est pas une dépendance du projet. |
| État réactif | **Signals** pour tout état local/dérivé de composant (`signal()`, `computed()`, `linkedSignal()`). RxJS réservé aux flux asynchrones réels (Firestore `onSnapshot`, debounce de recherche) — converti en signal via `toSignal()` dès que possible, pas trimballé dans les templates. |
| Formulaires | **Signal Forms** (stable en v22) pour tout nouveau formulaire. Reactive Forms classique interdit sur du code neuf. |
| Injection de dépendances | `inject()` en haut de classe. Constructeur avec paramètres DI interdit sur du code neuf. |
| Inputs/Outputs | API signal : `input()`, `input.required()`, `output()`. Décorateurs `@Input()`/`@Output()` interdits sur du code neuf. |
| Templates | Nouvelle syntaxe de contrôle de flux : `@if`, `@for` (avec `track` obligatoire), `@switch`. `*ngIf`/`*ngFor` interdits. |
| Nommage fichiers | `kebab-case`, suffixe explicite du type : `.page.ts`, `.component.ts`, `.repository.ts`, `.service.ts`, `.pipe.ts`, `.guard.ts` |
| Nommage classes | `PascalCase` + suffixe correspondant : `DayPage`, `MealCardComponent`, `FoodRepository` |
| Sélecteurs de composants | Préfixe `dt-` (DailyTrainer), kebab-case : `dt-meal-card` |
| Un fichier = une entité exportée | Pas de fichier `utils.ts` fourre-tout. Pas de barrel `index.ts` qui ré-exporte tout un dossier (casse le tree-shaking et masque les dépendances réelles) |
| Lazy loading | Chaque feature est chargée via `loadComponent`/`loadChildren` dans `app.routes.ts`. Aucune feature n'est importée en eager dans `app.config.ts`. |
| Accessibilité | Angular Aria (stable v22) utilisé pour tout composant interactif custom (listbox d'autocomplete, etc.) |

---

## 4. Clean code (religion)

### 4.1 Règles dures **[BLOQUANT]**

- **Fonctions ≤ 25 lignes.** Au-delà, extraire.
- **Un niveau d'imbrication ≤ 3.** Guard clauses plutôt que `if` imbriqués.
- **Pas de nombre magique.** `2000` devient `DEFAULT_KCAL_TARGET`.
- **Pas de `any`, pas de `!` (non-null assertion) sans commentaire justifiant pourquoi c'est sûr.**
- **Pas de commentaire qui explique le "quoi".** Le code doit être assez clair pour ça. Un commentaire n'est toléré que pour expliquer un "pourquoi" non évident (ex: "USDA renvoie parfois `null` pour la fibre sur les produits laitiers, on traite comme 0").
- **Gestion d'erreur explicite.** Un appel à `FoodRepository` ou à la Cloud Function `searchFood` qui peut échouer renvoie un `Result<T, Error>` ou équivalent — pas d'exception silencieuse avalée par un `catch {}` vide.

### 4.2 Nommage

- Noms de variables/fonctions en anglais, explicites, pas d'abréviation sauf convention du domaine déjà actée dans la spec (`kcal`, `g` pour grammes).
- Un booléen commence par `is`/`has`/`should` (`isLoading`, `hasTargetExceeded`).
- Une fonction qui retourne sans effet de bord est un verbe à l'infinitif implicite (`computeNutrients`, pas `nutrientsComputation`).

### 4.3 SOLID appliqué concrètement

- **SRP** : un service = une responsabilité (`NutritionCalcService` ne fait QUE des calculs, il n'appelle jamais Firestore).
- **DIP** : `domain/` ne dépend d'aucune interface Firebase — il reçoit des `Food`/`MealItem` en entrée, retourne des `NutrientProfile` en sortie. Testable sans émulateur Firebase.
- **DRY avec discernement** : deux bouts de code qui se ressemblent aujourd'hui mais évoluent pour des raisons métier différentes ne sont PAS factorisés (duplication honnête > mauvaise abstraction).

---

## 5. Tests **[BLOQUANT]**

| Type | Cible | Outil |
|---|---|---|
| Unitaire | Tout `core/domain/*` (calculs, parsing, agrégation) — couverture **100%** exigée sur ce dossier | Jest (`ng test` configuré avec le builder Jest, pas Karma) |
| Unitaire | `core/data-access/*` via émulateur Firestore | Jest + `@firebase/rules-unit-testing` |
| Composant | Dumb components : rendu + interactions (`input`/`output`) | Angular Testing Library |
| Règles de sécurité | `firestore.rules` testées explicitement (un user ne peut pas lire les données d'un autre `uid`) | `@firebase/rules-unit-testing` |
| E2E | Parcours "saisir un repas → voir le récap" a minima | Playwright |

Aucune PR touchant `core/domain` n'est mergée sans test associé — vérifié en CI, pas à l'œil.

---

## 6. Outillage d'enforcement

- **ESLint** : `angular-eslint` (règles strictes : `prefer-standalone`, `prefer-signals`, pas de `any`), `eslint-plugin-boundaries` pour les règles de la section 2.2, `@typescript-eslint/no-explicit-any` en erreur (pas warning).
- **Prettier** : formatage automatique, aucune discussion de style en revue de code.
- **TypeScript strict** : `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true` dans `tsconfig.json`.
- **Husky + lint-staged** : lint + format + tests unitaires sur les fichiers modifiés à chaque commit.
- **Commitlint** : Conventional Commits obligatoire (`feat:`, `fix:`, `refactor:`, `test:`...).
- **CI (GitHub Actions ou équivalent)** : lint, typecheck, tests, build — les 4 doivent passer avant merge. Pas de bypass admin.

---

## 7. Definition of Done / checklist de revue

Une PR n'est mergeable que si :

1. Le lint et les règles de boundaries passent sans exception ni `eslint-disable` non justifié en commentaire
2. Aucune logique métier n'est présente dans un composant `.component.ts` ou `.page.ts`
3. Aucun accès Firestore en dehors de `core/data-access`
4. Les fonctions ajoutées dans `core/domain` sont testées avec couverture 100%
5. Aucune régression de couverture globale
6. Les noms de fichiers/classes respectent la table de la section 3
7. Pas de `any`, pas de `console.log` oublié, pas de code commenté laissé en place

---

## 8. DevOps / Git — hébergement GitHub

### 8.1 Modèle de branches **[BLOQUANT]**

- `main` : toujours déployable, protégée. Reflète ce qui est en production.
- `develop` (optionnel si l'équipe reste à 1-2 devs — sinon obligatoire) : intégration avant release.
- `feature/<ticket-ou-courte-description>` : une branche par fonctionnalité, créée depuis `main` (ou `develop`), courte durée de vie (< 1 semaine visé).
- `fix/<description>` : correctifs.
- `hotfix/<description>` : correctif urgent créé depuis `main`, mergé dans `main` **et** rebasé sur `develop`.

Aucun commit direct sur `main`. Aucune exception, y compris pour "un tout petit fix".

### 8.2 Règles de protection de branche (GitHub) **[BLOQUANT]**

Sur `main` (et `develop` si utilisée) :

- Pull Request obligatoire avant merge, pas de push direct (`Require a pull request before merging`)
- Au moins **1 review approuvée** avant merge (2 si l'équipe grandit)
- **Status checks obligatoires** avant merge : lint, typecheck, tests unitaires, build — tous verts (`Require status checks to pass`)
- **Branche à jour avant merge** (`Require branches to be up to date before merging`) pour éviter les merges sur du code obsolète
- `Require conversation resolution before merging` : tous les commentaires de review doivent être résolus
- **Interdiction du force-push et de la suppression** de `main`/`develop`
- Merge strategy imposée : **squash and merge** uniquement (historique `main` linéaire, un commit = une PR)
- Signature des commits recommandée (`Require signed commits`) si plusieurs contributeurs

### 8.3 Convention de commits et de PR

- **Conventional Commits** obligatoire (déjà imposé par commitlint en section 6) : `feat(day): ajoute le calcul du solde calorique`, `fix(auth): corrige la redirection après login`
- Titre de PR = résumé conventional commit ; description de PR doit répondre à : quoi, pourquoi, comment tester
- Une PR = un sujet. Pas de PR "fourre-tout" qui mélange une feature et un refactor sans rapport
- Lien vers le ticket/issue GitHub obligatoire dans la description

### 8.4 CI/CD (GitHub Actions)

Deux workflows minimum :

**`ci.yml`** — déclenché sur toute PR vers `main`/`develop` :
1. Install + cache des dépendances
2. Lint (`eslint`, boundaries incluses)
3. Typecheck (`tsc --noEmit`)
4. Tests unitaires + couverture (échoue si couverture de `core/domain` < 100%)
5. Build (`ng build`)
6. (Optionnel) Déploiement d'une preview Firebase Hosting par PR (`firebase hosting:channel:deploy pr-<number>`) pour review visuelle

**`deploy.yml`** — déclenché sur merge dans `main` :
1. Re-run des mêmes checks (jamais de déploiement sans re-vérification)
2. `firebase deploy --only hosting,functions,firestore:rules` vers l'environnement de production
3. Déploiement des Cloud Functions avec les secrets (clé USDA) injectés depuis GitHub Secrets / Firebase Functions secrets, jamais commités

### 8.5 Environnements Firebase

- **Projet Firebase `dailytrainer-dev`** : utilisé en local et pour les previews de PR
- **Projet Firebase `dailytrainer-prod`** : déployé uniquement depuis `main`, via `deploy.yml`
- Fichiers `environment.ts` / `environment.prod.ts` ne contiennent que la config Firebase **publique** (elle est publique par design côté Firebase Web SDK — la vraie sécurité est dans `firestore.rules`, pas dans le secret de ce fichier)
- Secrets réels (clé API USDA) : jamais dans le repo, ni dans `environment.ts`. Stockés via `firebase functions:secrets:set` et référencés en CI via GitHub Secrets pour le déploiement automatisé

### 8.6 Gestion des secrets **[BLOQUANT]**

- Aucune clé, token, ou credential dans le code source, même dans un commit qui sera "corrigé après"
- `.gitignore` couvre `*.env`, `serviceAccountKey.json`, tout fichier de credentials Firebase Admin
- Scan de secrets en CI (ex: `gitleaks` en step de `ci.yml`) bloquant si une clé est détectée dans un diff

### 8.7 Versioning et releases

- Semantic Versioning (`MAJOR.MINOR.PATCH`) dès que l'app est utilisée au-delà d'un usage perso
- Tag Git + release GitHub à chaque déploiement en production, changelog généré depuis les Conventional Commits (ex: `standard-version` ou `release-please`)

---

## 9. Interdits explicites (liste noire)

- `NgModule`
- `*ngIf` / `*ngFor` / `*ngSwitch`
- `@Input()` / `@Output()` décorateurs sur du code neuf
- Constructeur avec injection de paramètres sur du code neuf (`inject()` uniquement)
- Appel Firestore (`collection`, `doc`, `getDocs`, `onSnapshot`...) en dehors de `core/data-access`
- `any`
- Fichier `utils.ts`/`helpers.ts` fourre-tout
- Barrel `index.ts` qui ré-exporte un dossier entier
- `catch {}` vide ou qui ne fait que `console.log`
- Import direct entre deux `features/*`
- Commit ou push direct sur `main`
- Merge sans review approuvée ou avec un status check rouge
- Secret/clé API commité, même temporairement
