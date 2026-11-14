describe('Sleeve Shopping List & Deficit Calculator', () => {
  function calculateDeficit(
    cardsNeeded: number,
    packsOwned: number,
    packSize: number,
    looseSleeves = 0
  ) {
    const totalStock = packsOwned * packSize + looseSleeves;
    const deficit = Math.max(0, cardsNeeded - totalStock);
    const packsToBuy = deficit > 0 ? Math.ceil(deficit / packSize) : 0;
    const surplusAfterPurchase = packsToBuy > 0 ? packsToBuy * packSize - deficit : totalStock - cardsNeeded;

    return { totalStock, deficit, packsToBuy, surplusAfterPurchase };
  }

  it('calculates deficit and recommended packs correctly when stock is insufficient', () => {
    // 140 cards needed, 1 pack of 100 owned
    const result = calculateDeficit(140, 1, 100, 0);

    expect(result.totalStock).toBe(100);
    expect(result.deficit).toBe(40);
    expect(result.packsToBuy).toBe(1); // 1 extra pack of 100 needed
    expect(result.surplusAfterPurchase).toBe(60); // 60 loose sleeves remaining
  });

  it('reports zero deficit and zero packs to buy when stock covers need', () => {
    // 80 cards needed, 1 pack of 100 owned
    const result = calculateDeficit(80, 1, 100, 0);

    expect(result.totalStock).toBe(100);
    expect(result.deficit).toBe(0);
    expect(result.packsToBuy).toBe(0);
    expect(result.surplusAfterPurchase).toBe(20);
  });

  it('accounts for loose extra sleeves in stock calculation', () => {
    // 120 cards needed, 1 pack of 100 owned + 25 loose sleeves = 125 stock
    const result = calculateDeficit(120, 1, 100, 25);

    expect(result.totalStock).toBe(125);
    expect(result.deficit).toBe(0);
    expect(result.packsToBuy).toBe(0);
  });
});

