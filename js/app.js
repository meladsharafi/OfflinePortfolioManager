//This file Location is: js/App.js

import { SymbolManager } from "./modules/SymbolManager.js";
import { TransactionManager } from "./modules/TransactionManager.js";
import { PortfolioManager } from "./modules/PortfolioManager.js";

class TradingApp {
  constructor() {
    this.symbolManager = new SymbolManager();
    this.transactionManager = new TransactionManager(this.symbolManager);
    this.portfolioManager = new PortfolioManager(this.symbolManager, this.transactionManager);
    this.transactionHistory = document.querySelector(".transaction-history");

    this.initElements();
    this.initEventListeners();
    this.renderAll();
  }

  initElements() {
    this.symbolNameInput = document.getElementById("symbolName");
    this.symbolPriceInput = document.getElementById("symbolPrice");
    this.addSymbolBtn = document.getElementById("addSymbolBtn");
    this.symbolList = document.querySelector(".symbol-list");

    this.transactionSymbolSelect = document.getElementById("transactionSymbol");
    this.transactionAmountInput = document.getElementById("transactionAmount");
    this.transactionPriceInput = document.getElementById("transactionPrice");
    this.buyBtn = document.getElementById("buyBtn");
    this.sellBtn = document.getElementById("sellBtn");
    this.transactionHistory = document.querySelector(".transaction-history");

    this.portfolioSummary = document.querySelector(".portfolio-summary");

    this.symbolTransactionsContainer = document.getElementById("symbolTransactions");
    this.symbolTransactionsList = document.getElementById("symbolTransactionsList");
    this.selectedSymbolName = document.getElementById("selectedSymbolName");
  }

  initEventListeners() {
    this.addSymbolBtn.addEventListener("click", () => this.handleAddSymbol());
    this.symbolList.addEventListener("click", (e) => this.handleSymbolListClick(e));

    this.buyBtn.addEventListener("click", () => this.handleAddTransaction("buy"));
    this.sellBtn.addEventListener("click", () => this.handleAddTransaction("sell"));
    this.transactionHistory.addEventListener("click", (e) => this.handleTransactionHistoryClick(e));

    this.transactionSymbolSelect.addEventListener("change", (e) => {
      this.renderSymbolTransactions(e.target.value);
    });

    // اضافه کردن event listener برای دکمه‌های حذف در بخش ثبت معامله
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn") && e.target.closest("#symbolTransactionsList")) {
        const index = parseInt(e.target.getAttribute("data-id"));
        const symbol = this.transactionSymbolSelect.value;
        this.handleDeleteTransaction(index, symbol);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("edit-btn") && e.target.closest("#symbolTransactionsList")) {
        const index = e.target.getAttribute("data-id");
        this.prepareTransactionEditForm(index);
      }
    });
  }

  async handleAddSymbol() {
    const name = this.symbolNameInput.value.trim();
    const currentPrice = this.symbolPriceInput.value.trim();

    try {
      await this.symbolManager.addSymbol(name, currentPrice ? parseFloat(currentPrice) : null);
      this.clearSymbolInputs();
      this.renderAll();
    } catch (error) {
      alert(error.message);
    }
  }

  async handleAddTransaction(type) {
    const symbol = this.transactionSymbolSelect.value;
    const amount = this.transactionAmountInput.value.trim();
    const price = this.transactionPriceInput.value.trim();

    try {
      const success = await this.transactionManager.addTransaction(type, symbol, amount, price);
      if (success) {
        this.clearTransactionInputs();

        // به‌روزرسانی همه بخش‌ها
        this.renderAll();

        // به‌روزرسانی خاص بخش تراکنش‌های نماد انتخاب شده
        this.renderSymbolTransactions(symbol);

        // فوکوس خودکار به فیلد مقدار
        this.transactionAmountInput.focus();
      }
    } catch (error) {
      alert(error.message);
    }
  }

  handleSymbolListClick(e) {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.getAttribute("data-id");
      this.symbolManager.deleteSymbol(index);
      this.renderAll();
    } else if (e.target.classList.contains("edit-btn")) {
      const index = e.target.getAttribute("data-id");
      this.prepareSymbolEditForm(index);
    } else if (e.target.closest(".symbol-item")) {
      const index = e.target.closest(".symbol-item").querySelector(".edit-btn").getAttribute("data-id");
      const symbol = this.symbolManager.getSymbol(index);
      this.transactionSymbolSelect.value = symbol.name;
      this.transactionSymbolSelect.dispatchEvent(new Event("change"));
      document.querySelector(".transaction-box").scrollIntoView({ behavior: "smooth" });
    }
  }

  handleTransactionHistoryClick(e) {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.getAttribute("data-id");
      this.transactionManager.deleteTransaction(index);
      this.renderAll();
      this.renderSymbolTransactions(this.transactionSymbolSelect.value);
    } else if (e.target.classList.contains("edit-btn")) {
      const index = e.target.getAttribute("data-id");
      this.prepareTransactionEditForm(index);
    }
  }
  prepareSymbolEditForm(index) {
    const symbol = this.symbolManager.getSymbol(index);

    this.symbolNameInput.value = symbol.name;
    this.symbolPriceInput.value = symbol.currentPrice || "";

    // ذخیره index فعلی در یک متغیر
    const currentIndex = index;

    this.addSymbolBtn.textContent = "ویرایش نماد";
    this.addSymbolBtn.onclick = async () => {
      const name = this.symbolNameInput.value.trim();
      const currentPrice = this.symbolPriceInput.value.trim();

      try {
        await this.symbolManager.updateSymbol(
          currentIndex, // استفاده از index ذخیره شده
          name,
          currentPrice ? parseInt(currentPrice) : null
        );
        this.clearSymbolInputs();
        this.addSymbolBtn.textContent = "ثبت نماد";
        this.addSymbolBtn.onclick = () => this.handleAddSymbol();
        this.renderAll();
      } catch (error) {
        alert(error.message);
      }
    };
  }

prepareTransactionEditForm(index) {
  const transaction = this.transactionManager.getTransaction(index);

  // پر کردن فرم با اطلاعات تراکنش
  this.transactionSymbolSelect.value = transaction.symbol;
  this.transactionAmountInput.value = transaction.amount;
  this.transactionPriceInput.value = transaction.price;

  // غیرفعال کردن انتخاب نماد هنگام ویرایش
  this.transactionSymbolSelect.disabled = true;

  // مخفی کردن دکمه‌های خرید و فروش
  this.buyBtn.style.display = "none";
  this.sellBtn.style.display = "none";

  // ایجاد دکمه‌های ثبت و لغو ویرایش
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "flex w-full gap-2";

  // دکمه لغو ویرایش
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "لغو ویرایش";
  cancelBtn.className = "flex-1 p-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 duration-300";

  // دکمه ثبت ویرایش
  const updateBtn = document.createElement("button");
  updateBtn.textContent = "ثبت ویرایش";
  updateBtn.className = "flex-1 p-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 duration-300";


  // حذف دکمه‌های قبلی اگر وجود داشته باشد
  const existingButtons = document.querySelector(".edit-transaction-buttons");
  if (existingButtons) {
    existingButtons.remove();
  }
  buttonsContainer.classList.add("edit-transaction-buttons");

  // رویدادهای دکمه‌ها
  updateBtn.onclick = async () => {
    const symbol = this.transactionSymbolSelect.value;
    const amount = parseFloat(this.transactionAmountInput.value);
    const price = parseFloat(this.transactionPriceInput.value);

    try {
      await this.transactionManager.updateTransaction(index, symbol, amount, price);
      this.resetEditForm();
      this.renderAll();
      this.renderSymbolTransactions(symbol);
      // نمایش تراکنش‌های نماد مربوطه
      this.showSymbolTransactions(symbol);
    } catch (error) {
      alert(error.message);
    }
  };

  cancelBtn.onclick = () => {
    this.resetEditForm();
  };

  buttonsContainer.appendChild(updateBtn);
  buttonsContainer.appendChild(cancelBtn);

  // اضافه کردن دکمه‌ها به فرم
  const formActions = document.querySelector(".transaction-form-actions");
  if (formActions) {
    formActions.prepend(buttonsContainer);
  } else {
    this.transactionSymbolSelect.parentNode.insertBefore(buttonsContainer, this.buyBtn);
  }

  // اسکرول به بخش معاملات نماد
  this.showSymbolTransactions(transaction.symbol);
}

// متد جدید برای نمایش تراکنش‌های نماد
showSymbolTransactions(symbol) {
  this.transactionSymbolSelect.value = symbol;
  this.transactionSymbolSelect.dispatchEvent(new Event("change"));
  document.querySelector(".transaction-box").scrollIntoView({ behavior: "smooth" });
}

// متد جدید برای بازنشانی فرم ویرایش
resetEditForm() {
  this.clearTransactionInputs();
  this.transactionSymbolSelect.disabled = false;
  
  const editButtons = document.querySelector(".edit-transaction-buttons");
  if (editButtons) editButtons.remove();
  
  this.buyBtn.style.display = "block";
  this.sellBtn.style.display = "block";
}

  renderAll() {
    const currentSymbol = this.transactionSymbolSelect.value;

    this.renderSymbols();
    this.renderPortfolio();
    this.renderTransactionHistory();

    // بازگرداندن نماد انتخاب شده
    if (currentSymbol) {
      this.transactionSymbolSelect.value = currentSymbol;
      this.renderSymbolTransactions(currentSymbol);
    }
  }

  renderSymbols() {
    this.symbolList.innerHTML = "";
    const symbols = this.symbolManager.getAllSymbols();
    if (symbols.length === 0) return;
    symbols.forEach((symbol, index) => {
      const symbolItem = document.createElement("div");
      symbolItem.className = "symbol-item p-2 flex justify-between text-sm border rounded-md cursor-pointer hover:bg-gray-100 duration-300";
      symbolItem.innerHTML = `
        <span class="symbol-name">${symbol.name} ${symbol.currentPrice ? `(${symbol.currentPrice})` : ""}</span>
          <div class="">
            <button class="edit-btn  text-gray-500 hover:text-gray-700 duration-300" data-id="${index}">ویرایش</button>
            <button class="delete-btn  text-gray-500 hover:text-gray-700 duration-300" data-id="${index}">حذف</button>
          </div>      
      `;
      this.symbolList.appendChild(symbolItem);
    });

    this.updateSymbolSelect();
  }

  updateSymbolSelect() {
    this.transactionSymbolSelect.innerHTML = '<option value="">انتخاب نماد</option>';
    this.symbolManager.getAllSymbols().forEach((symbol) => {
      const option = document.createElement("option");
      option.value = symbol.name;
      option.textContent = symbol.name;
      this.transactionSymbolSelect.appendChild(option);
    });
  }

  renderTransactionHistory() {
    this.transactionHistory.innerHTML = "";
    const transactions = this.transactionManager.getAllTransactions();
    
    if (transactions.length === 0) {
      this.transactionHistory.innerHTML = '<p class="text-gray-500 p-1 text-xs">معامله‌ای ثبت نشده است.</p>';
      return;
    }
  
    // نمایش معاملات از جدید به قدیم اما با حفظ ایندکس اصلی
    for (let i = transactions.length - 1; i >= 0; i--) {
      const transaction = transactions[i];
      const transactionItem = document.createElement("div");
      transactionItem.innerHTML = this.getTransactionTemplate({
        ...transaction,
        originalIndex: i // ذخیره ایندکس اصلی
      }, true);
      this.transactionHistory.appendChild(transactionItem);
    }
  }

  renderSymbolTransactions(symbol) {
    const container = document.getElementById("symbolTransactions");
    const transactionsList = document.getElementById("symbolTransactionsList");
    const symbolNameElement = document.getElementById("selectedSymbolName");

    if (!symbol) {
      container.classList.add("hidden");
      return;
    }

    const allTransactions = this.transactionManager.getAllTransactions();
    const transactions = allTransactions
      .map((t, originalIndex) => ({ ...t, originalIndex }))
      .filter((t) => t.symbol === symbol)
      .reverse();

    symbolNameElement.textContent = symbol;
    transactionsList.innerHTML = "";

    if (transactions.length === 0) {
      transactionsList.innerHTML = '<p class="text-gray-500 p-1 text-xs">تراکنشی برای این نماد یافت نشد.</p>';
      container.classList.remove("hidden");
      return;
    }

    transactions.forEach((transaction) => {
      const transactionItem = document.createElement("div");
      transactionItem.innerHTML = this.getTransactionTemplate(transaction, true);
      transactionsList.appendChild(transactionItem);
    });

    container.classList.remove("hidden");
  }

  renderPortfolio() {
    this.portfolioSummary.innerHTML = "";
    const portfolio = this.portfolioManager.getPortfolio();

    if (Object.keys(portfolio).length === 0) {
      this.portfolioSummary.innerHTML = '<p class="text-gray-500">معامله ای ثبت نشده است.</p>';
      return;
    }

    // جدا کردن نمادهای فعال و فروخته شده
    const activeSymbols = [];
    const soldOutSymbols = [];

    for (const symbol in portfolio) {
      if (portfolio[symbol].isSoldOut) {
        soldOutSymbols.push({ symbol, data: portfolio[symbol] });
      } else {
        activeSymbols.push({ symbol, data: portfolio[symbol] });
      }
    }

    // نمایش نمادهای فعال
    activeSymbols.forEach(({ symbol, data }) => {
      this.createPortfolioItem(symbol, data);
    });

    // اضافه کردن عنوان "نمادهای فروخته شده" اگر چنین نمادهایی وجود دارند
    if (soldOutSymbols.length > 0) {
      const soldOutHeader = document.createElement("div");
      soldOutHeader.className = "mt-2";
      soldOutHeader.innerHTML = `
        <h3 class="text-sm font-semibold text-gray-700">نمادهای فروخته شده</h3>
      `;
      this.portfolioSummary.appendChild(soldOutHeader);

      // نمایش نمادهای فروخته شده
      soldOutSymbols.forEach(({ symbol, data }) => {
        this.createPortfolioItem(symbol, data);
      });
    }
  }

  // تابع جداگانه برای ایجاد آیتم پرتفوی
  createPortfolioItem(symbol, data) {
    const currentPrice = this.symbolManager.getCurrentPrice(symbol);
    const portfolioItem = document.createElement("div");
    portfolioItem.className = `portfolio-item flex flex-col gap-2 p-2 border rounded-md hover:bg-gray-100 duration-300 cursor-pointer`;

    portfolioItem.addEventListener("click", () => {
      this.transactionSymbolSelect.value = symbol;
      this.transactionSymbolSelect.dispatchEvent(new Event("change"));
      document.querySelector(".transaction-box").scrollIntoView({
        behavior: "smooth",
      });
    });

    const amount = data.amount || 0;
    const avgPrice = data.avgPrice || 0;
    const currentValue = data.currentValue || 0;
    const displayValue = currentPrice ? (currentPrice * amount).toLocaleString() : "-";
    const totalProfit = data.totalProfit || 0; // مجموع سود/زیان فروش‌ها

    portfolioItem.innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <h4 class="font-semibold text-gray-700">${symbol}</h4>

      <p class="">
        <span>موجودی:</span>
        <span class="text-left">${amount}</span>
      </p>

      <p class="text-gray-500">
        <span>میانگین قیمت خرید:</span>
        <span class="text-left">${avgPrice.toLocaleString()}</span>
      </p>    

      <p class="text-gray-500">
        <span>پرداختی:</span>
        <span class="text-left">${currentValue.toLocaleString()}</span>
      </p>   

      <p class="text-gray-500">
        <span>ارزش روز:</span>
        <span class="text-left">${displayValue}</span>
      </p>    
  
      <p class="text-gray-500">
        <span>سود/زیان فعلی:</span>
        <span class="text-left">-</span>
      </p>  
      
      <p class="text-gray-500">
        <span>
        ${totalProfit >= 0 ? "سود فروش:" : "زیان فروش:"}
        </span>
        <span class="text-left ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}">
          ${Math.abs(totalProfit).toLocaleString()}
          
        </span>
      </p>  
    </div>
    `;

    if (currentPrice && !data.isSoldOut) {
      const profitLoss = (currentPrice - avgPrice) * amount;
      portfolioItem.innerHTML += `
      <div class="text-gray-500">
        <span>قیمت روز:</span>
        <span class="text-left">${currentPrice.toLocaleString()} | </span>
        <span class="">
          ${profitLoss >= 0 ? "سود:" : "زیان:"}
          ${Math.abs(profitLoss).toLocaleString()}
        </span>
      </div>
      `;
    }

    this.portfolioSummary.appendChild(portfolioItem);
  }

  clearSymbolInputs() {
    this.symbolNameInput.value = "";
    this.symbolPriceInput.value = "";
  }

  clearTransactionInputs() {
    this.transactionAmountInput.value = "";
    this.transactionPriceInput.value = "";
    // this.transactionSymbolSelect.value = "";
  }
  getTransactionTemplate(transaction, showActions = true) {
    let profitInfo = "";
    if (transaction.type === "sell" && transaction.profit !== undefined) {
      profitInfo = ` | ${transaction.profit >= 0 ? "سود" : "زیان"}: ${Math.abs(transaction.profit).toLocaleString()}`;
    }

    const date = new Date(transaction.date).toLocaleString("fa-IR");
    const typeClass = transaction.type === "buy" ? "bg-green-50" : "bg-red-50";

    const actions = showActions
      ? `
      <div class="flex gap-1">
        <button class="edit-btn text-gray-500 hover:text-gray-700 duration-300" data-id="${transaction.originalIndex}">
          ویرایش
        </button>
        <button class="delete-btn text-gray-500 hover:text-gray-700 duration-300" data-id="${transaction.originalIndex}">
          حذف
        </button>
      </div>
    `
      : "";

    return `
      <div class="${typeClass} p-2 rounded-md text-xs">
          <div class="flex flex-col gap-2">
          <div class="flex justify-between">
          <span class="">
            ${transaction.type === "buy" ? "خرید" : "فروش"} 
            ${transaction.amount}
            عدد 
            "${transaction.symbol}"
          </span>
          ${actions}
          </div>
            <div class="flex gap-2 justify-between">
              <span>
              قیمت: 
              ${transaction.price.toLocaleString()} 
              ${profitInfo}
              </span>
              <span class="text-gray-500">${date}</span>
            </div>
          </div>
      </div>
    `;
  }

  handleDeleteTransaction(index, symbol) {
    this.transactionManager.deleteTransaction(index);
    this.renderAll();
    this.renderSymbolTransactions(symbol); // به‌روزرسانی لیست تراکنش‌های نماد
  }
}

// Initialize the app
new TradingApp();
