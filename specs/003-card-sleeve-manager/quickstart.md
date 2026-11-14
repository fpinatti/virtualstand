# Quickstart Validation Guide: Card Sleeve Manager

**Feature**: `003-card-sleeve-manager`  
**Date**: 2026-11-14  
**Status**: Ready for Validation  

---

## 1. Prerequisites

Before testing or running sleeve workflows:
- Node.js $\ge 20$, Expo CLI.
- Ensure at least 1-2 games are imported into SQLite (e.g. Catan or custom test titles).

Refer to:
- [Data Model](data-model.md) for table schemas.
- [Sleeve Contract](contracts/sleeve-contract.ts) for service method contracts.

---

## 2. Automated Test Execution

### 2.1 Shopping Calculator & Deficit Math Tests
Validate that the shopping list algorithm correctly subtracts owned inventory from un-sleeved card demand:

```bash
# Run unit tests for sleeve math and shopping list aggregation
npm test -- tests/unit/sleeve-calculator.test.ts tests/unit/sleeve-catalog.test.ts
```
**Expected Outcome**:
- Un-sleeved cards are correctly grouped by dimension key.
- Available inventory packs and loose cards are deducted accurately.
- Required packs to buy rounds up properly ($\lceil \text{deficit} / \text{packSize} \rceil$).

---

## 3. End-to-End Validation Scenarios

### Scenario A: View Game Sleeves & Toggle Status
1. Open any game from the Collection screen or 3D shelf.
2. In the game detail view, tap **Gerenciar Sleeves**.
3. **Validation Check**:
   - Required card formats and quantities are pre-populated from the community catalog (or can be added manually).
   - Tapping the "Envelopado" checkbox updates the status and recalculates remaining cards.

### Scenario B: Manage Sleeve Inventory
1. Navigate to the **Sleeves** tab in the app.
2. Under "Meu Estoque", add 1 pack of 100 sleeves ($63.5 \times 88\text{ mm}$).
3. **Validation Check**:
   - The stock is saved locally in SQLite and immediately visible.

### Scenario C: Automated Shopping List Calculation
1. Ensure you have un-sleeved games requiring sleeves.
2. View the "Lista de Compras" section.
3. **Validation Check**:
   - The shopping list automatically displays the net deficit after deducting owned stock.
   - Recommends the exact number of packs to purchase.

