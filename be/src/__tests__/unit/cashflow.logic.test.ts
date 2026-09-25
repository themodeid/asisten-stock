describe("Cashflow & Financial Math — In-Memory Logic Tests", () => {
  interface Wallet {
    id: number;
    name: string;
    cash_balance: number;
  }

  interface Transaction {
    id: number;
    wallet_id?: number;
    to_wallet_id?: number;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    category: string;
    amount: number;
  }

  const applyTransaction = (wallets: Wallet[], tx: Transaction) => {
    if (tx.type === "INCOME") {
      const w = wallets.find((x) => x.id === tx.wallet_id);
      if (w) w.cash_balance += tx.amount;
    } else if (tx.type === "EXPENSE") {
      const w = wallets.find((x) => x.id === tx.wallet_id);
      if (w) w.cash_balance -= tx.amount;
    } else if (tx.type === "TRANSFER") {
      const fromW = wallets.find((x) => x.id === tx.wallet_id);
      const toW = wallets.find((x) => x.id === tx.to_wallet_id);
      if (fromW && toW) {
        fromW.cash_balance -= tx.amount;
        toW.cash_balance += tx.amount;
      }
    }
  };

  it("adds money to wallet on INCOME", () => {
    const wallets: Wallet[] = [
      { id: 1, name: "Bank BCA", cash_balance: 10000000 },
    ];

    applyTransaction(wallets, {
      id: 1,
      wallet_id: 1,
      type: "INCOME",
      category: "GAJI",
      amount: 5000000,
    });

    expect(wallets[0].cash_balance).toBe(15000000);
  });

  it("deducts money from wallet on EXPENSE", () => {
    const wallets: Wallet[] = [
      { id: 2, name: "GoPay", cash_balance: 500000 },
    ];

    applyTransaction(wallets, {
      id: 2,
      wallet_id: 2,
      type: "EXPENSE",
      category: "MAKANAN",
      amount: 45000,
    });

    expect(wallets[0].cash_balance).toBe(455000);
  });

  it("transfers balance accurately between two wallets without changing total net cash", () => {
    const wallets: Wallet[] = [
      { id: 1, name: "Bank BCA", cash_balance: 10000000 },
      { id: 2, name: "GoPay", cash_balance: 200000 },
    ];

    const initialTotal = wallets.reduce((sum, w) => sum + w.cash_balance, 0);
    expect(initialTotal).toBe(10200000);

    // Top up GoPay 500k from BCA
    applyTransaction(wallets, {
      id: 3,
      wallet_id: 1,
      to_wallet_id: 2,
      type: "TRANSFER",
      category: "TRANSFER",
      amount: 500000,
    });

    expect(wallets[0].cash_balance).toBe(9500000);
    expect(wallets[1].cash_balance).toBe(700000);

    const finalTotal = wallets.reduce((sum, w) => sum + w.cash_balance, 0);
    expect(finalTotal).toBe(10200000); // Total net cash unchanged!
  });

  it("calculates monthly cashflow summary (Income, Expense, Net Savings)", () => {
    const txs: Transaction[] = [
      { id: 1, type: "INCOME", category: "GAJI", amount: 15000000 },
      { id: 2, type: "INCOME", category: "DIVIDEN", amount: 500000 },
      { id: 3, type: "EXPENSE", category: "MAKANAN", amount: 2000000 },
      { id: 4, type: "EXPENSE", category: "TAGIHAN", amount: 1500000 },
      { id: 5, type: "EXPENSE", category: "TRANSPORT", amount: 500000 },
      { id: 6, type: "TRANSFER", category: "TRANSFER", amount: 1000000 },
    ];

    const totalIncome = txs
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = txs
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpense;

    expect(totalIncome).toBe(15500000);
    expect(totalExpense).toBe(4000000);
    expect(netSavings).toBe(11500000);
  });

  it("calculates expense category percentage breakdown correctly", () => {
    const expenses = [
      { category: "MAKANAN", amount: 3000000 },
      { category: "TAGIHAN", amount: 1000000 },
    ];
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    const makananPercent = (expenses[0].amount / totalExpense) * 100;
    const tagihanPercent = (expenses[1].amount / totalExpense) * 100;

    expect(makananPercent).toBe(75);
    expect(tagihanPercent).toBe(25);
    expect(makananPercent + tagihanPercent).toBe(100);
  });
});
