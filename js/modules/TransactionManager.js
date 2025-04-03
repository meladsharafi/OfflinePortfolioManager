export class TransactionManager {
  constructor(symbolManager) {
    this.symbolManager = symbolManager;
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  }

  saveToStorage() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }

  addTransaction(type, symbol, amount, price) {
    this.validateInputs(type, symbol, amount, price);
    
    const amountNum = Number(amount);
    const priceNum = Number(price);
    
    if (type === 'sell') {
      const available = this.getAvailableAmount(symbol);
      if (amountNum > available) {
        throw new Error(`موجودی کافی نیست. موجودی شما: ${available}`);
      }
    }
    
    const transaction = {
      type,
      symbol,
      amount: amountNum,
      price: priceNum,
      date: new Date().toISOString()
    };
    
    if (type === 'sell') {
      transaction.profit = this.calculateProfit(transaction);
    }
    
    this.transactions.push(transaction);
    this.saveToStorage();
    return true;
  }

  validateInputs(type, symbol, amount, price) {
    if (!symbol || symbol.trim() === '') {
      throw new Error('لطفا نماد را انتخاب کنید');
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('لطفا مقدار معتبر وارد کنید');
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      throw new Error('لطفا قیمت معتبر وارد کنید');
    }
  }

  calculateProfit(transaction) {
    if (transaction.type !== 'sell') return 0;
    
    const buyTransactions = this.transactions
      .filter(t => t.symbol === transaction.symbol && t.type === 'buy');

    // محاسبه میانگین وزنی قیمت خرید
    const { totalAmount, totalCost } = buyTransactions.reduce(
      (acc, buy) => {
        return {
          totalAmount: acc.totalAmount + buy.amount,
          totalCost: acc.totalCost + (buy.amount * buy.price)
        };
      },
      { totalAmount: 0, totalCost: 0 }
    );

    if (totalAmount === 0) return 0;

    const avgBuyPrice = Math.round(totalCost / totalAmount);
    return (transaction.price - avgBuyPrice) ;
  }

  updateTransaction(index, symbol, amount, price) {
    this.validateInputs('sell', symbol, amount, price);
    
    const oldTransaction = this.transactions[index];
    const amountNum = amount;
    const priceNum = price;
    
    if (oldTransaction.type === 'sell') {
      let available = this.getAvailableAmount(symbol);
      available += oldTransaction.amount; // برگشت مقدار قبلی
      
      if (amountNum > available) {
        throw new Error(`موجودی کافی نیست. حداکثر مقدار قابل فروش: ${available}`);
      }
    }
    
    const updatedTransaction = {
      ...oldTransaction,
      symbol,
      amount: amountNum,
      price: priceNum
    };
    
    if (oldTransaction.type === 'sell') {
      updatedTransaction.profit = this.calculateProfit(updatedTransaction);
    }
    
    this.transactions[index] = updatedTransaction;
    this.saveToStorage();
    return true;
  }

  deleteTransaction(index) {
    this.transactions.splice(index, 1);
    this.saveToStorage();
  }

  getTransaction(index) {
    return this.transactions[index];
  }

  getAllTransactions() {
    return this.transactions;
  }

  getAvailableAmount(symbolName) {
    return this.transactions.reduce((total, t) => {
      if (t.symbol === symbolName) {
        return t.type === 'buy' ? total + t.amount : total - t.amount;
      }
      return total;
    }, 0);
  }

  getAverageBuyPrice(symbolName) {
    const buyTransactions = this.transactions.filter(
      t => t.symbol === symbolName && t.type === 'buy'
    );

    if (buyTransactions.length === 0) return 0;

    const totalAmount = buyTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCost = buyTransactions.reduce((sum, t) => sum + (t.amount * t.price), 0);

    return Math.round(totalCost / totalAmount);
  }
}