export class PortfolioManager {
  // Constructor برای مقداردهی اولیه با symbolManager و transactionManager
  constructor(symbolManager, transactionManager) {
    this.symbolManager = symbolManager; // مدیریت نمادها
    this.transactionManager = transactionManager; // مدیریت تراکنش‌ها
  }

  // در کلاس PortfolioManager
  getPortfolio() {
    const portfolio = {};

    // فقط نمادهایی که حداقل یک تراکنش داشته‌اند را در نظر بگیریم
    const tradedSymbols = new Set(this.transactionManager.getAllTransactions().map((t) => t.symbol));

    // 1. محاسبه خریدها فقط برای نمادهای معامله شده
    this.transactionManager.getAllTransactions().forEach((t) => {
      if (t.type === "buy") {
        if (!portfolio[t.symbol]) {
          portfolio[t.symbol] = {
            amount: 0,
            totalCost: 0,
            avgPrice: 0,
            isSoldOut: false,
            hasTrades: true, // نشان می‌دهد این نماد معامله شده است
          };
        }
        portfolio[t.symbol].amount += t.amount;
        portfolio[t.symbol].totalCost += t.price;
      }
    });

    // 2. محاسبه میانگین قیمت خرید
    for (const symbol in portfolio) {
      portfolio[symbol].avgPrice = portfolio[symbol].amount > 0 ? Math.floor(portfolio[symbol].totalCost / portfolio[symbol].amount) : 0;
    }

    // 3. اعمال فروش‌ها
    this.transactionManager.getAllTransactions().forEach((t) => {
      if (t.type === "sell" && portfolio[t.symbol]) {
        const soldValue = t.amount * portfolio[t.symbol].avgPrice;
        portfolio[t.symbol].amount -= t.amount;
        portfolio[t.symbol].totalCost -= soldValue;

        if (portfolio[t.symbol].amount <= 0) {
          portfolio[t.symbol].isSoldOut = true;
          portfolio[t.symbol].amount = 0;
        }
      }
    });

    // 4. محاسبه ارزش کل نهایی
    for (const symbol in portfolio) {
      portfolio[symbol].currentValue = portfolio[symbol].totalCost;
    }

    return portfolio;
  }
}
