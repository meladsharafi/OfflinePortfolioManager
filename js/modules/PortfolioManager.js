export class PortfolioManager {
  // Constructor برای مقداردهی اولیه با symbolManager و transactionManager
  constructor(symbolManager, transactionManager) {
    this.symbolManager = symbolManager; // مدیریت نمادها
    this.transactionManager = transactionManager; // مدیریت تراکنش‌ها
  }

  getPortfolio() {
    const portfolio = {};
    
    // 1. محاسبه خریدها
    this.transactionManager.getAllTransactions().forEach(t => {
      if (t.type === 'buy') {
        if (!portfolio[t.symbol]) {
          portfolio[t.symbol] = { amount: 0, totalCost: 0, avgPrice: 0, isSoldOut: false };
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
  
    // 3. اعمال فروش‌ها
    this.transactionManager.getAllTransactions().forEach(t => {
      if (t.type === 'sell' && portfolio[t.symbol]) {
        const soldValue = t.amount * portfolio[t.symbol].avgPrice;
        portfolio[t.symbol].amount -= t.amount;
        portfolio[t.symbol].totalCost -= soldValue;
        
        if (portfolio[t.symbol].amount <= 0) {
          portfolio[t.symbol].isSoldOut = true; // علامت گذاری به عنوان فروخته شده
          portfolio[t.symbol].amount = 0; // مقدار را صفر می‌کنیم اما آیتم را حذف نمی‌کنیم
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
