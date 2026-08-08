# DailyTrainer — Spécification technique
## Calculateur nutritionnel automatique (kcal, macro & micronutriments)

> Adapté pour la stack **Angular + Firebase**.

---

## 1. Objectif du projet

Application web permettant de :
- Saisir rapidement les aliments consommés dans la journée (par repas)
- Calculer automatiquement les calories, macronutriments (protéines, glucides, lipides, fibres) et micronutriments (vitamines, minéraux) de chaque aliment et de chaque repas
- Agréger ces données sur une journée complète et les comparer à des repères journaliers (AJR)
- Conserver un historique consultable (jour, semaine, mois), synchronisé automatiquement dans le cloud

Cas d'usage type : l'utilisateur note "100g bacon, 500g crudités (tomates cerise, concombre, carotte râpée, chou râpé, radis râpés), 2 œufs, 100g pdt cuite" et l'app renvoie instantanément un tableau kcal + macro + micro, comme fait manuellement dans cette conversation.

---

## 2. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Frontend | **Angular** (Angular CLI, TypeScript, standalone components) | Typage fort natif pour les modèles nutritionnels, structure en modules bien adaptée à une app avec plusieurs écrans (Journée, Historique, Recherche), RxJS pratique pour les flux Firestore en temps réel |
| Backend | **Firebase Cloud Functions** (Node.js + TypeScript, callable functions ou HTTPS) | Sert uniquement à ce que le client ne doit pas faire directement : appeler USDA/Open Food Facts avec une clé API secrète, et pré-calculer/agréger si besoin. Pas de serveur à gérer, déploiement intégré à Firebase |
| Base de données | **Cloud Firestore** | Base NoSQL managée, synchronisation temps réel avec le front Angular (`@angular/fire`), persistance offline native (cache local automatique côté client), pas de serveur DB à gérer, scalable si usage multi-utilisateur plus tard |
| Authentification | **Firebase Authentication** (email/mdp ou Google, activable dès la V1 même en mono-utilisateur) | Recommandé dès le départ : permet d'associer les données Firestore à un `uid` et sécuriser l'accès via les règles Firestore, sans effort de mise en place supplémentaire |
| Hébergement | **Firebase Hosting** | Déploiement direct du build Angular (`ng build` → `firebase deploy`), CDN inclus, HTTPS automatique |
| API nutrition externe | **Open Food Facts** (gratuite, sans clé, base collaborative, bonne couverture produits emballés/marques comme Aldi) en complément **USDA FoodData Central** (gratuite avec clé API, fiable pour aliments bruts/génériques) | Combine couverture produits de marque (OFF) + fiabilité nutritionnelle sur aliments génériques (USDA). Les deux sont appelées **depuis une Cloud Function**, jamais directement depuis le navigateur, pour ne pas exposer la clé USDA |
| Graphiques | **ngx-charts** (ou **Chart.js** via `ng2-charts`) | Librairies Angular-natives pour barres/radar, équivalent de Recharts côté React |

> Pas de Prisma / SQLite / Express dans cette version : Firestore remplace à la fois la base de données et une bonne partie de la couche API (lecture/écriture directes depuis Angular via le SDK, sécurisées par des règles Firestore). Les Cloud Functions ne portent que la logique qui doit rester côté serveur (clés API, agrégations lourdes, tâches planifiées).

---

## 3. Architecture générale

```
DailyTrainer/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/           # Interfaces TS partagées : Food, Meal, DailyLog...
│   │   │   ├── services/         # FoodService, MealService, DailyLogService, NutritionCalcService
│   │   │   └── firebase/         # Config Firebase, providers @angular/fire
│   │   ├── features/
│   │   │   ├── day/              # Écran "Ma journée" : saisie, récap, graphiques
│   │   │   ├── history/          # Écran "Historique"
│   │   │   └── food-search/      # Autocomplete / recherche aliment
│   │   ├── shared/                # Composants UI réutilisables (tableaux, cartes de repas)
│   │   └── app.routes.ts
│   └── environments/              # environment.ts avec config Firebase (clés publiques Firestore/Auth)
├── functions/                      # Cloud Functions (Node.js + TypeScript)
│   ├── src/
│   │   ├── index.ts
│   │   ├── foodSearch.ts          # Callable function : recherche OFF + USDA, cache, résolution
│   │   └── clients/
│   │       ├── openFoodFactsClient.ts
│   │       └── usdaClient.ts
│   └── package.json
├── firestore.rules                 # Règles de sécurité (accès limité à l'uid du user)
├── firestore.indexes.json
├── firebase.json                   # Config hosting + functions + firestore
└── DailyTrainer_SPEC.md
```

---

## 4. Modèle de données

### 4.1 Types partagés (TypeScript, `core/models`)

```typescript
interface NutrientProfile {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g?: number;
  sodium_mg?: number;
  // micronutriments (tous optionnels, dépend de la source)
  vitaminA_mcg?: number;
  vitaminC_mg?: number;
  vitaminD_mcg?: number;
  vitaminB12_mcg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  magnesium_mg?: number;
  potassium_mg?: number;
  zinc_mg?: number;
  // extensible : ajouter au besoin
}

interface Food {
  id: string;                 // = id du document Firestore
  name: string;                // "Bacon Aldi", "Carotte râpée"
  source: 'local' | 'openfoodfacts' | 'usda';
  sourceId?: string;           // code-barres OFF, fdcId USDA
  per100g: NutrientProfile;    // valeurs pour 100g/100ml de référence
  createdAt: Timestamp;
  ownerUid?: string;           // uid si correction manuelle propre à l'utilisateur
}

interface MealItem {
  id: string;
  foodId: string;
  foodName: string;            // dénormalisé pour affichage sans jointure
  quantity_g: number;
  computed: NutrientProfile;   // per100g * (quantity_g / 100), calculé à l'ajout
}

interface Meal {
  id: string;
  label: string;               // "Repas de midi", "Collation 16h"
  items: MealItem[];           // sous-collection ou tableau embarqué (voir 4.2)
  totals: NutrientProfile;     // somme des items, calculé
}

interface DailyLog {
  id: string;                  // = date "2026-08-08"
  date: string;
  meals: Meal[];
  totals: NutrientProfile;     // somme de tous les repas
  targets?: NutrientProfile;   // objectifs journaliers (AJR ou personnalisés)
}
```

### 4.2 Structure Firestore

Firestore étant du NoSQL orienté documents, on privilégie une structure **dénormalisée et peu profonde** plutôt que le schéma relationnel Prisma d'origine :

```
users/{uid}/
  foods/{foodId}                      # cache local des aliments résolus (par utilisateur)
    name, source, sourceId, per100g, createdAt

  dailyLogs/{date}                    # date au format "YYYY-MM-DD" comme ID du document
    date, totals, targets
    meals/{mealId}                    # sous-collection
      label, totals
      items/{itemId}                  # sous-collection
        foodId, foodName, quantity_g, computed
```

- **`meals` et `items` en sous-collections** (plutôt qu'en tableaux imbriqués dans le doc `dailyLogs`) : évite les limites de taille de document Firestore et permet des écritures/suppressions granulaires (ajout d'un item = 1 write, pas de réécriture du doc entier).
- **`totals`** stockés dénormalisés sur `dailyLogs` et `meals`, recalculés à chaque écriture d'item (côté client via un service, ou via une Cloud Function déclenchée par un trigger Firestore `onWrite` sur `items` pour garantir la cohérence même en cas d'écritures concurrentes).
- **`foods`** joue le rôle du cache local de la spec d'origine (remplace la table `Food` de Prisma) : premier réflexe de recherche avant d'appeler une Cloud Function externe.

### 4.3 Règles de sécurité Firestore (extrait)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 5. Logique de calcul (le cœur du système)

### 5.1 Résolution d'un aliment saisi en langage libre

Entrée utilisateur type : `"100gr de bacon aldi"`

Pipeline de résolution :
1. **Parsing** (côté Angular, service pur, testable) : extraire `{ quantity: 100, unit: 'g', name: 'bacon aldi' }` (regex simple sur `\d+\s*(g|gr|kg|ml|cl|cas|cac|unité)?\s*(de|d')?\s*(.+)`)
2. **Recherche locale** : requête Firestore sur `users/{uid}/foods` (nom similaire) — évite de re-taper "bacon aldi" à chaque fois et garantit la cohérence avec les repas précédents. Firestore ne supportant pas la recherche plein texte nativement, utiliser soit un filtre `where('name', '>=', ...) / ('name', '<=', ...)` sur préfixe, soit une intégration légère (ex. Algolia via extension Firebase) si la recherche approximative devient un besoin fort
3. **Si absent → appel à une Cloud Function `searchFood`** (callable, `functions/src/foodSearch.ts`) qui, côté serveur :
   - Si le nom contient une marque ("Aldi", "Lidl"...) → interroge **Open Food Facts** en premier (`GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=bacon+aldi&json=1`)
   - Sinon (aliment générique : "carotte", "œuf", "pomme de terre") → interroge **USDA FoodData Central** en premier (`GET https://api.nal.usda.gov/fdc/v1/foods/search?query=carrot&api_key=...`, clé stockée dans la config Firebase Functions, jamais exposée au client)
   - Fallback croisé si la première source ne renvoie rien
   - Retourne une liste courte de résultats candidats (nom + kcal/100g)
4. **Confirmation utilisateur** : si plusieurs résultats possibles, l'UI Angular propose une liste courte pour que l'utilisateur choisisse le bon produit
5. **Sauvegarde locale** : une fois choisi, l'aliment est écrit dans `users/{uid}/foods` (via le SDK Firestore côté client, ou renvoyé par la Cloud Function qui l'écrit elle-même) pour ne plus jamais requêter l'API externe pour ce produit
6. **Calcul** : `computed = per100g * (quantity_g / 100)`, fait côté client dans un service Angular pur (`NutritionCalcService`), aucune dépendance externe

### 5.2 Agrégation

```
Meal.totals     = somme(MealItem.computed) pour chaque item du repas
DailyLog.totals = somme(Meal.totals) pour chaque repas de la journée
```

Simple somme composant par composant (kcal, protéines, glucides, lipides, fibres, chaque micronutriment séparément). Recalculée côté client à chaque changement, et optionnellement recalculée/vérifiée côté serveur par un trigger Cloud Function `onWrite` pour garder les documents `totals` toujours cohérents même en cas d'écritures multi-appareils.

### 5.3 Comparaison aux objectifs (AJR)

Table de référence des Apports Journaliers Recommandés (configurable, valeurs par défaut adulte), stockée en constante côté Angular et dupliquée dans `users/{uid}/dailyLogs/{date}.targets` si personnalisée :

```typescript
const DEFAULT_TARGETS: NutrientProfile = {
  kcal: 2000,
  protein_g: 70,
  carbs_g: 260,
  fat_g: 70,
  fiber_g: 30,
  vitaminC_mg: 80,
  vitaminA_mcg: 800,
  calcium_mg: 800,
  iron_mg: 14,
  sodium_mg: 2000, // plafond à ne pas dépasser, pas un objectif à atteindre
  // ...
};
```

`% des AJR atteint` = `(totals.X / targets.X) * 100`.

> Idéalement rendre ces valeurs **personnalisables** dans les paramètres (âge, poids, sexe, niveau d'activité) avec une formule de calcul des besoins caloriques (Mifflin-St Jeor) si tu veux aller plus loin qu'une table fixe.

---

## 6. Accès aux données (remplace les endpoints REST)

Avec Firestore, la majorité des opérations CRUD se font **directement depuis Angular via le SDK** (`@angular/fire/firestore`), sécurisées par les règles Firestore — pas besoin d'endpoints REST dédiés. Seules les opérations nécessitant une clé secrète ou une logique serveur passent par des Cloud Functions.

| Opération | Mécanisme |
|---|---|
| Rechercher un aliment (cache local) | Requête Firestore directe : `collection(users/{uid}/foods)` avec filtre sur `name` |
| Rechercher un aliment (API externe) | Cloud Function callable `searchFood({ query })` → OFF/USDA, ne touche pas Firestore directement |
| Enregistrer un aliment résolu | `setDoc`/`addDoc` Firestore direct dans `users/{uid}/foods` |
| Récupérer le DailyLog d'une date | `getDoc(users/{uid}/dailyLogs/{date})` + `getDocs` sur les sous-collections `meals`/`items` (ou `onSnapshot` pour du temps réel) |
| Créer un repas | `addDoc`/`setDoc` Firestore direct dans `.../dailyLogs/{date}/meals` |
| Ajouter un item à un repas | `addDoc` Firestore direct dans `.../meals/{mealId}/items`, déclenche recalcul des totals (trigger ou service client) |
| Supprimer un item | `deleteDoc` Firestore direct |
| Résumé + % AJR | Calculé côté client (service Angular) à partir des `totals` déjà en cache local Firestore, pas d'appel réseau nécessaire |
| Historique sur une période | Requête Firestore `where('date', '>=', from).where('date', '<=', to)` sur `dailyLogs`, triée pour les graphiques d'évolution |

---

## 7. Interface utilisateur (V1 minimaliste)

### Écran principal — "Ma journée" (`features/day`)
- Sélecteur de date (par défaut : aujourd'hui)
- Un bloc par repas ("Repas de midi", "+ Ajouter un repas")
- Dans chaque bloc : liste des aliments saisis avec quantité, kcal, et bouton supprimer
- Champ de saisie rapide en haut de chaque repas : `[quantité] [unité] [nom aliment]` → autocomplete qui interroge d'abord le cache Firestore local, puis la Cloud Function `searchFood` si rien trouvé
- En bas de page : **tableau récapitulatif journalier** (macro + micro), reprenant le format utilisé dans nos échanges (tableau kcal/protéines/glucides/lipides/fibres, puis tableau micronutriments avec % AJR)
- Graphique en barres (ngx-charts) : répartition macro en % des kcal (protéines/glucides/lipides)
- Graphique en radar ou barres horizontales : micronutriments en % des AJR
- Données synchronisées en temps réel via `onSnapshot` (utile si utilisation multi-appareils, ex. saisie sur mobile puis consultation sur desktop)

### Écran "Historique" (`features/history`)
- Courbe d'évolution des kcal/protéines sur 7/30 jours, alimentée par la requête Firestore sur `dailyLogs`

---

## 8. Plan de développement suggéré (par étapes)

1. **Setup projet** : `ng new dailytrainer`, `firebase init` (Hosting, Firestore, Functions, Auth), installer `@angular/fire`
2. **Modèle de données** : définir les interfaces TS dans `core/models`, écrire `firestore.rules` et `firestore.indexes.json`
3. **Auth** : activer Firebase Authentication (email/mdp suffit en V1), guard Angular sur les routes protégées
4. **Service de calcul** : `NutritionCalcService` — fonctions pures `computeNutrients(food, quantity_g) → NutrientProfile` et `aggregateTotals(items) → NutrientProfile` (faciles à tester unitairement, aucune dépendance externe/Firebase)
5. **Cloud Function `searchFood`** : clients `openFoodFactsClient.ts` et `usdaClient.ts`, clé USDA en config Functions (`firebase functions:secrets:set`), cache écrit dans Firestore après première résolution
6. **Services Firestore** : `FoodService`, `DailyLogService`, `MealService` (wrapper autour de `@angular/fire/firestore`)
7. **UI de saisie** : formulaire + autocomplete (`features/food-search`)
8. **UI récapitulatif** : tableaux + graphiques ngx-charts (reprendre le format des tableaux qu'on a utilisés dans cette conversation comme référence visuelle)
9. **AJR & % objectifs**
10. **Historique**
11. **Déploiement** : `ng build && firebase deploy`
12. *(Bonus V2)* : reconnaissance vocale/texte libre plus poussée (NLP léger) pour parser des phrases comme "100gr de bacon aldi, 500gr de crudités..." en plusieurs lignes d'un coup

---

## 9. Notes sur la fiabilité des données

- Open Food Facts est **collaboratif** : les valeurs peuvent être incomplètes ou erronées pour certains produits de marque. Toujours afficher la source et permettre une correction manuelle par l'utilisateur (sauvegardée dans `users/{uid}/foods` avec `source: 'local'`, prioritaire sur l'API pour les prochaines fois).
- USDA FoodData Central est une référence officielle fiable pour les aliments bruts (légumes, viandes non transformées, féculents).
- Pour les recettes maison sans équivalent (ex: "crudités mélangées maison"), privilégier la saisie **par composant** (comme fait dans cette conversation : tomates + concombre + carotte séparément) plutôt qu'un seul aliment composite, pour garder la précision.
- La clé API USDA ne doit **jamais** être présente dans le bundle Angular (elle serait visible dans le code source côté navigateur) : elle vit exclusivement dans la config des Cloud Functions.

---

## 10. Points d'attention spécifiques à Firebase

- **Coûts** : Firestore facture à la lecture/écriture de documents. La structure en sous-collections (`meals`, `items`) multiplie les documents ; pour un usage mono-utilisateur cela reste négligeable, mais à surveiller si l'app devient multi-utilisateur avec beaucoup d'historique.
- **Offline-first** : Firestore gère nativement le cache local et la synchronisation différée — pas besoin de logique de cache maison comme dans la version SQLite/Prisma.
- **Limites de taille de document** : 1 Mo par document Firestore — raison pour laquelle `items` est une sous-collection et non un tableau embarqué dans `meals`.
- **Cloud Functions "cold start"** : la Cloud Function `searchFood` peut avoir une latence au premier appel après une période d'inactivité ; acceptable pour une recherche d'aliment ponctuelle, mais à garder en tête si l'UX doit être instantanée.

---

## 11. Prochaines étapes concrètes

Une fois ce document dans le repo `DailyTrainer`, tu peux :
- Le donner tel quel à un assistant de code avec l'instruction "implémente ce projet selon cette spec, en commençant par l'étape 1 du plan de développement"
- Ajuster les détails (ex: Auth Google plutôt qu'email/mdp, ngx-charts plutôt que Chart.js) selon tes préférences
