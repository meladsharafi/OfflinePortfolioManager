export class PortfolioManager {
  constructor(symbolManager, transactionManager) {
    this.symbolManager = symbolManager;
    this.transactionManager = transactionManager;
  }

  getPortfolio() {
    const portfolio = {};
    
    // 1. محاسبه خریدها
    this.transactionManager.getAllTransactions().forEach(t => {
      if (t.type === 'buy') {
        if (!portfolio[t.symbol]) {
          portfolio[t.symbol] = { amount: 0, totalCost: 0, avgPrice: 0 };
        }
        portfolio[t.symbol].amount += t.amount;
        portfolio[t.symbol].totalCost += t.price;
      }
    });

    // 2. محاسبه میانگین قیمت خرید
    for (const symbol in portfolio) {
      portfolio[symbol].avgPrice = portfolio[symbol].amount > 0 
        ? Math.floor(portfolio[symbol].totalCost / portfolio[symbol].amount)
        : 0;
    }

    // 3. اعمال فروش‌ها با به‌روزرسانی صحیح ارزش کل
    this.transactionManager.getAllTransactions().forEach(t => {
      if (t.type === 'sell' && portfolio[t.symbol]) {
        const soldValue = t.amount * portfolio[t.symbol].avgPrice;
        portfolio[t.symbol].amount -= t.amount;
        portfolio[t.symbol].totalCost -= soldValue;
        
        if (portfolio[t.symbol].amount <= 0) {
          delete portfolio[t.symbol];
        }
      }
    });

    // 4. محاسبه ارزش کل نهایی
    for (const symbol in portfolio) {
      const currentPrice = this.symbolManager.getCurrentPrice(symbol);
      portfolio[symbol].currentValue = currentPrice
        ? currentPrice * portfolio[symbol].amount
        : portfolio[symbol].totalCost;
    }

    return portfolio;
  }
}