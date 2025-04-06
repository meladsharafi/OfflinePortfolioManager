
//This file Location is: js/modules/TransactinManager.js

import { PortfolioManager } from './PortfolioManager.js';
export class TransactionManager {
  // Constructor برای مقداردهی اولیه با symbolManager و بارگیری تراکنش‌ها از localStorage
  constructor(symbolManager) {
    this.symbolManager = symbolManager; // مدیریت نمادها
    this.transactions = JSON.parse(localStorage.getItem("transactions")) || []; // بارگیری تراکنش‌های ذخیره شده
  }

  // ذخیره تراکنش‌ها در localStorage
  saveToStorage() {
    localStorage.setItem("transactions", JSON.stringify(this.transactions));
  }

  // افزودن تراکنش جدید
  addTransaction(type, symbol, amount, price) {
    this.validateInputs(type, symbol, amount, price); // اعتبارسنجی ورودی‌ها

    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(price);

    // بررسی موجودی کافی برای فروش
    if (type === "sell") {
      const available = this.getAvailableAmount(symbol);
      if (amountNum > available) {
        throw new Error(`موجودی کافی نیست. موجودی شما: ${available}`);
      }
    }

    // ایجاد شیء تراکنش جدید
    const transaction = {
      type,
      symbol,
      amount: amountNum,
      price: priceNum,
      date: new Date().toISOString(), // تاریخ فعلی
    };

    // محاسبه سود برای تراکنش‌های فروش
    if (type === "sell") {
      transaction.profit = this.calculateProfit(transaction);
    }

    this.transactions.push(transaction); // افزودن به لیست تراکنش‌ها
    this.saveToStorage(); // ذخیره تغییرات
    return true;
  }

  // اعتبارسنجی ورودی‌های تراکنش
  validateInputs(type, symbol, amount, price) {
    if (!symbol || symbol.trim() === "") {
      throw new Error("لطفا نماد را انتخاب کنید");
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error("لطفا مقدار معتبر وارد کنید");
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      throw new Error("لطفا قیمت معتبر وارد کنید");
    }
  }

  // محاسبه سود حاصل از فروش
  calculateProfit(transaction) {
    if (transaction.type !== "sell") return 0;
    
    // دریافت وضعیت فعلی پرتفوی برای این نماد
    const portfolio = new PortfolioManager(this.symbolManager, this).getPortfolio();
    const symbolData = portfolio[transaction.symbol];
    
    // اگر نماد در پرتفوی وجود ندارد یا موجودی صفر است
    if (!symbolData || symbolData.amount === 0) return 0;
    
    // محاسبه سود/زیان بر اساس میانگین قیمت خرید فعلی
    const profit = transaction.price - (transaction.amount * symbolData.avgPrice);
    return profit;
  }

  // به‌روزرسانی تراکنش موجود
  updateTransaction(index, symbol, amount, price) {
    this.validateInputs("sell", symbol, amount, price);

    const oldTransaction = this.transactions[index];
    const amountNum = amount;
    const priceNum = price;

    // بررسی موجودی کافی برای فروش (با در نظر گرفتن مقدار قبلی)
    if (oldTransaction.type === "sell") {
      let available = this.getAvailableAmount(symbol);
      available += oldTransaction.amount; // برگشت مقدار قبلی

      if (amountNum > available) {
        throw new Error(`موجودی کافی نیست. حداکثر مقدار قابل فروش: ${available}`);
      }
    }

    // ایجاد تراکنش به‌روز شده
    const updatedTransaction = {
      ...oldTransaction,
      symbol,
      amount: amountNum,
      price: priceNum,
    };

    // محاسبه مجدد سود برای فروش‌ها
    if (oldTransaction.type === "sell") {
      updatedTransaction.profit = this.calculateProfit(updatedTransaction);
    }

    this.transactions[index] = updatedTransaction; // اعمال تغییرات
    this.saveToStorage(); // ذخیره تغییرات
    return true;
  }

  // حذف تراکنش
  deleteTransaction(index) {
    this.transactions.splice(index, 1);
    this.saveToStorage();
  }

  // دریافت یک تراکنش خاص
  getTransaction(index) {
    return this.transactions[index];
  }

  // دریافت تمام تراکنش‌ها
  getAllTransactions() {
    return this.transactions;
  }

  // محاسبه موجودی قابل فروش یک نماد
  getAvailableAmount(symbolName) {
    return this.transactions.reduce((total, t) => {
      if (t.symbol === symbolName) {
        return t.type === "buy" ? total + t.amount : total - t.amount;
      }
      return total;
    }, 0);
  }

  // محاسبه میانگین قیمت خرید یک نماد
  getAverageBuyPrice(symbolName) {
    const buyTransactions = this.transactions.filter((t) => t.symbol === symbolName && t.type === "buy");

    if (buyTransactions.length === 0) return 0;

    const totalAmount = buyTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCost = buyTransactions.reduce((sum, t) => sum + t.amount * t.price, 0);

    return totalCost / totalAmount;
  }
}
