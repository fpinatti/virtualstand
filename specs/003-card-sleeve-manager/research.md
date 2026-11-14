# Research & Architecture Decisions: Card Sleeve Manager

**Feature**: `003-card-sleeve-manager`  
**Date**: 2026-11-14  
**Status**: Completed  

---

## 1. Card Sleeve Data Modeling & Multi-Size Support

### Context
BoardGameGeek XMLAPI2 does not expose structured sleeve metadata. A game frequently contains multiple card decks of different dimensions (e.g. 7 Wonders: 157 cards $65 \times 100\text{ mm}$ + 42 cards $44 \times 68\text{ mm}$ in expansions).

### Decision
- **Schema Separation**:
  - `game_sleeves`: Table keyed by `id`, referencing `games.bggId`. Each record models a specific card set within the game (`card_set_name`, `format_name`, `width_mm`, `height_mm`, `card_count`, `is_sleeved`).
  - `sleeve_inventory`: Table modeling user-owned loose and pack stock (`format_name`, `width_mm`, `height_mm`, `brand`, `pack_size`, `packs_owned`, `loose_sleeves`).
- **Normalized Dimension Matching**:
  - Sleeves match across different names using a normalized dimension key: `${Math.round(width)}x${Math.round(height)}` with a $\pm 1\text{ mm}$ tolerance for minor brand label variations (e.g., $63.5 \times 88\text{ mm}$ vs $64 \times 89\text{ mm}$ Standard Card Game).

### Rationale
- Completely independent of upstream BGG API limitations.
- Preserves full user control: collectors can customize card counts or mark specific decks as sleeved.

### Alternatives Considered
- *Single sleeve format per game*: Rejected. Fails on games with multiple card sizes (Euro + Mini Euro, Tarot + Standard).
- *Sticking sleeve data into a JSON string field inside `games`*: Hurts relational aggregation for shopping list calculations.

---

## 2. Community Catalog Dataset & Pre-Population

### Context
Users should not have to manually measure cards or lookup sizes for hundreds of games on external forums.

### Decision
- Bundle an embedded, offline TypeScript/JSON catalog compiled from the BoardGameGeek Sleeve Size GeekList (ID 164572) and community open datasets.
- Schema per catalog entry:
  ```typescript
  {
    bggId: number,
    gameTitle: string,
    cards: Array<{
      cardSetName: string,
      formatName: string,
      widthMm: number,
      heightMm: number,
      cardCount: number,
    }>
  }
  ```
- Seed populated games automatically upon collection import, while allowing user overrides.

### Rationale
- 100% offline-first (Constitution Principle I). No external scraping network requests required.
- Instantaneous matching during collection sync.

### Alternatives Considered
- *Scraping BGG GeekLists dynamically at runtime*: Violates offline-first principle and easily breaks due to HTML changes or IP blocks.

---

## 3. Shopping List & Stock Allocation Algorithm

### Context
Collectors often have spare sleeve packs and want to know exactly what to buy without manual spreadsheet math.

### Decision
- **Demand Calculation Algorithm**:
  1. Filter all records in `game_sleeves` where `is_sleeved == 0` for owned games (`statusOwn == 1`).
  2. Group demanded cards by normalized format dimension `${width}x${height}`.
  3. Aggregate available inventory for each dimension:
     $$\text{totalStock} = (\text{packsOwned} \times \text{packSize}) + \text{looseSleeves}$$
  4. Calculate net deficit:
     $$\text{deficitCards} = \max(0, \text{totalDemandedCards} - \text{totalStock})$$
     $$\text{packsToBuy} = \lceil \text{deficitCards} / \text{defaultPackSize} \rceil$$
  5. Compute surplus loose cards remaining if packs are bought:
     $$\text{surplus} = (\text{packsToBuy} \times \text{defaultPackSize}) - \text{deficitCards}$$

### Rationale
- Mathematical precision eliminates wasted money on excess packs.
- Executes in under 10 ms for hundreds of games directly in SQLite or memory.

