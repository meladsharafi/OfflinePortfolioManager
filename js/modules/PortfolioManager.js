export class PortfolioManager {
  constructor(symbolManager, transactionManager) {
    this.symbolManager = symbolManager;
    this.transactionManager = transactionManager;
  }

  getPortfolio() {
    const portfolio = {};
    const transactions = [...this.transactionManager.getAllTransactions()]
    .sort((a, b) => new Date(a.date) - new Date(b.date));

    // پردازش تراکنش‌ها بدون مرتب‌سازی زمانی
    transactions.forEach((t) => {
      if (!portfolio[t.symbol]) {
        portfolio[t.symbol] = {
          amount: 0,
          totalCost: 0,
          avgPrice: 0,
          isSoldOut: false,
          hasTrades: true,
        };
      }

      if (t.type === "buy") {
        // محاسبه میانگین قیمت خرید
        if (portfolio[t.symbol].amount === 0) {
          portfolio[t.symbol].avgPrice = t.price / t.amount;
        } else {
          portfolio[t.symbol].avgPrice = (portfolio[t.symbol].amount * portfolio[t.symbol].avgPrice + t.price) / (portfolio[t.symbol].amount + t.amount);
        }

        portfolio[t.symbol].amount += t.amount;
        portfolio[t.symbol].totalCost += t.price;
        portfolio[t.symbol].isSoldOut = false; // اگر خرید جدید داشتیم، دیگر فروخته شده نیست
      } else if (t.type === "sell") {
        const soldValue = t.amount * portfolio[t.symbol].avgPrice;
        portfolio[t.symbol].amount -= t.amount;
        portfolio[t.symbol].totalCost -= soldValue;

        if (portfolio[t.symbol].amount <= 0) {
          portfolio[t.symbol].isSoldOut = true;
          portfolio[t.symbol].amount = 0;
          portfolio[t.symbol].totalCost = 0;
          portfolio[t.symbol].avgPrice = 0;
        }
      }
    });

    // حذف نمادهایی که موجودی دارند از بخش فروخته شده‌ها
    const finalPortfolio = {};
    for (const symbol in portfolio) {
      if (portfolio[symbol].amount > 0) {
        portfolio[symbol].isSoldOut = false; // اگر موجودی دارد، قطعاً فروخته شده نیست
      }

      // فقط نمادهایی که حداقل یک تراکنش داشته‌اند را نگه می‌داریم
      if (portfolio[symbol].hasTrades) {
        finalPortfolio[symbol] = {
          ...portfolio[symbol],
          avgPrice: portfolio[symbol].avgPrice,
          currentValue: portfolio[symbol].totalCost,
        };
      }
    }

    return finalPortfolio;
  }
}
