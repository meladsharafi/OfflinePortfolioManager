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
  }

  async handleAddSymbol() {
    const name = this.symbolNameInput.value.trim();
    const currentPrice = this.symbolPriceInput.value.trim();

    try {
      await this.symbolManager.addSymbol(name, currentPrice ? parseInt(currentPrice) : null);
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
        this.renderAll();
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
      // کلیک روی خود نماد
      const index = e.target.closest(".symbol-item").querySelector(".edit-btn").getAttribute("data-id");
      const symbol = this.symbolManager.getSymbol(index);
      this.transactionSymbolSelect.value = symbol.name;
      this.transactionSymbolSelect.dispatchEvent(new Event("change"));

      // اسکرول به بخش معاملات
      document.querySelector("#transactionSymbol").scrollIntoView({
        behavior: "smooth",
      });
    }
  }

  handleTransactionHistoryClick(e) {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.getAttribute("data-id");
      this.transactionManager.deleteTransaction(index);
      this.renderAll();
    } else if (e.target.classList.contains("edit-btn")) {
      const index = e.target.getAttribute("data-id");
      this.prepareTransactionEditForm(index);
    }
    this.renderSymbolTransactions(this.transactionSymbolSelect.value);
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

    this.transactionSymbolSelect.value = transaction.symbol;
    this.transactionAmountInput.value = transaction.amount;
    this.transactionPriceInput.value = transaction.price;

    this.buyBtn.style.display = "none";
    this.sellBtn.style.display = "none";

    const updateBtn = document.createElement("button");
    updateBtn.textContent = "ویرایش معامله";
    updateBtn.className = "w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600";

    updateBtn.onclick = async () => {
      const symbol = this.transactionSymbolSelect.value;
      const amount = this.transactionAmountInput.value.trim();
      const price = this.transactionPriceInput.value.trim();

      try {
        const success = await this.transactionManager.updateTransaction(index, symbol, amount, price);
        if (success) {
          this.clearTransactionInputs();
          updateBtn.remove();
          this.buyBtn.style.display = "block";
          this.sellBtn.style.display = "block";
          this.renderAll();
        }
      } catch (error) {
        alert(error.message);
      }
    };

    this.transactionSymbolSelect.parentNode.insertBefore(updateBtn, this.buyBtn);
  }

  renderAll() {
    this.renderSymbols();
    this.renderPortfolio();
    this.renderTransactionHistory(); // تابع جدید
  }

  renderSymbols() {
    this.symbolList.innerHTML = "";
    const symbols = this.symbolManager.getAllSymbols();

    symbols.forEach((symbol, index) => {
      const symbolItem = document.createElement("div");
      symbolItem.className = "symbol-item cursor-pointer"; // تغییر این خط
      symbolItem.innerHTML = `
      <div class="p-2 flex justify-between border rounded-md hover:bg-gray-100 duration-300">
        <span class="symbol-name">${symbol.name} ${symbol.currentPrice ? `(${symbol.currentPrice})` : ""}</span>
          <div class="">
            <button class="edit-btn text-gray-400 hover:text-gray-700 duration-300" data-id="${index}">ویرایش</button>
            <button class="delete-btn text-gray-400 hover:text-gray-700 duration-300" data-id="${index}">حذف</button>
          </div>
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
    const transactions = [...this.transactionManager.getAllTransactions()].reverse(); // تغییر این خط
  
    transactions.forEach((transaction) => { // حذف index از پارامترها
      const transactionItem = document.createElement("div");
      transactionItem.className = "transaction-item p-2 rounded-md text-xs " + 
        `${transaction.type === "buy" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`;
  
      let profitInfo = "";
      if (transaction.type === "sell" && transaction.profit !== undefined) {
        profitInfo = ` | ${transaction.profit >= 0 ? "سود" : "زیان"}: ${Math.abs(transaction.profit).toLocaleString()}`;
      }
  
      transactionItem.innerHTML = `
        <div class="">
          ${transaction.type === "buy" ? "خرید" : "فروش"} 
          ${transaction.amount}
          عدد
          <span class="font-semibold">${transaction.symbol}</span>
          <div class="flex justify-between">
            <p>
              به مبلغ: 
              ${transaction.price.toLocaleString()}${profitInfo}
            </p>
            <p>
              ${new Date(transaction.date).toLocaleString('fa-IR')} <!-- اضافه کردن تاریخ معامله -->
            </p>
          </div>
        </div>
      `;
      this.transactionHistory.appendChild(transactionItem);
    });
  }

  renderSymbolTransactions(symbol) {
    const container = document.getElementById("symbolTransactions");
    const transactionsList = document.getElementById("symbolTransactionsList");
    const symbolNameElement = document.getElementById("selectedSymbolName");

    if (!symbol) {
      container.classList.add("hidden");
      return;
    }

    const transactions = this.transactionManager
      .getAllTransactions()
      .filter((t) => t.symbol === symbol)
      .reverse(); // جدیدترین تراکنش‌ها اول نمایش داده شوند

    symbolNameElement.textContent = symbol;
    transactionsList.innerHTML = "";

    if (transactions.length === 0) {
      transactionsList.innerHTML = '<p class="text-gray-500 p-2">تراکنشی برای این نماد یافت نشد</p>';
      container.classList.remove("hidden");
      return;
    }

    transactions.forEach((transaction, index) => {
      const transactionItem = document.createElement("div");
      transactionItem.className = `p-2 rounded-md ${transaction.type === "buy" ? "bg-green-100 text-green-900" : "bg-red-50 text-red-900"}`;

      let profitInfo = "";
      if (transaction.type === "sell" && transaction.profit !== undefined) {
        profitInfo = ` | ${transaction.profit >= 0 ? "سود" : "زیان"}: ${Math.abs(transaction.profit).toLocaleString()}`;
      }

      transactionItem.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            ${transaction.type === "buy" ? "خرید" : "فروش"} 
            ${transaction.amount} عدد 
            <span>به مبلغ:  ${transaction.price.toLocaleString()} ${profitInfo}</span>
          </div>
          <div>
            <button class="edit-btn text-gray-400 hover:text-gray-600 ml-2" data-id="${index}">ویرایش</button>
            <button class="delete-btn text-gray-400 hover:text-gray-600" data-id="${index}">حذف</button>
          </div>
        </div>
      `;

      transactionsList.appendChild(transactionItem);
    });

    container.classList.remove("hidden");
  }

  renderPortfolio() {
    this.portfolioSummary.innerHTML = "";
    const portfolio = this.portfolioManager.getPortfolio();

    if (Object.keys(portfolio).length === 0) {
      this.portfolioSummary.innerHTML = '<p class="text-gray-500">هنوز معامله‌ای ثبت نشده است.</p>';
      return;
    }

    for (const symbol in portfolio) {
      const symbolData = portfolio[symbol];
      const currentPrice = this.symbolManager.getCurrentPrice(symbol);

      const portfolioItem = document.createElement("div");
      portfolioItem.className = "portfolio-item p-2 border rounded-md hover:bg-gray-100 duration-300 cursor-pointer";

      portfolioItem.innerHTML = `
      <h3 class="">${symbol}</h3>
      <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
        <p>
          <span>موجودی:</span>
          <span class="text-left">${symbolData.amount.toLocaleString()}</span>
        </p>

        <p>
          <span>ارزش روز:</span>
          <span class="text-left"> نشده</span>
        </p>    

        <p class="text-gray-400">
          <span>میانگین قیمت خرید:</span>
          <span class="text-left">${symbolData.avgPrice.toLocaleString()}</span>
        </p>     

        <p class="text-gray-400">
          <span >ارزش خرید:</span>
          <span class="text-left">${symbolData.currentValue.toLocaleString()}</span>
        </p>    
      </div>

      `;

      if (currentPrice) {
        const profitLoss = (currentPrice - symbolData.avgPrice) * symbolData.amount;
        portfolioItem.innerHTML += `
        <span>قیمت روز:</span>
        <span class="text-left">${currentPrice.toLocaleString()}</span>
        <span class="${profitLoss >= 0 ? "text-green-600" : "text-red-600"}">
          ${Math.abs(profitLoss).toLocaleString()}
          ${profitLoss >= 0 ? "(سود)" : "(زیان)"}
        </span>
      `;
      }

      this.portfolioSummary.appendChild(portfolioItem);
    }
  }

  clearSymbolInputs() {
    this.symbolNameInput.value = "";
    this.symbolPriceInput.value = "";
  }

  clearTransactionInputs() {
    this.transactionAmountInput.value = "";
    this.transactionPriceInput.value = "";
    this.transactionSymbolSelect.value = "";
  }
}

// Initialize the app
new TradingApp();
