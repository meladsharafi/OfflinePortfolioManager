export class SymbolManager {
  // Constructor برای مقداردهی اولیه و بارگیری نمادها از localStorage
  constructor() {
    this.symbols = JSON.parse(localStorage.getItem('symbols')) || [];
  }

  // ذخیره لیست نمادها در localStorage
  saveToStorage() {
    localStorage.setItem('symbols', JSON.stringify(this.symbols));
  }

  // افزودن نماد جدید به لیست
  addSymbol(name, currentPrice = null) {
    if (!name || name.trim() === '') {
      throw new Error('لطفا نام نماد را وارد کنید');
    }
    
    // نرمال‌سازی نام برای مقایسه
    const normalizedNewName = name.trim().toLowerCase();
    // بررسی وجود نماد تکراری
    const symbolExists = this.symbols.some(
      s => s.name.trim().toLowerCase() === normalizedNewName
    );
    
    if (symbolExists) {
      throw new Error('این نماد قبلاً ثبت شده است');
    }
    
    // افزودن نماد جدید به لیست
    this.symbols.push({ 
      name: name.trim(), 
      currentPrice: currentPrice !== null ? currentPrice : null 
    });
    this.saveToStorage();
  }

  // به‌روزرسانی اطلاعات نماد موجود
  updateSymbol(index, name, currentPrice = null) {
    if (!name || name.trim() === '') {
      throw new Error('لطفا نام نماد را وارد کنید');
    }
    
    // اگر نام تغییر کرده باشد، بررسی تکراری بودن انجام می‌شود
    if (this.symbols[index].name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      const normalizedNewName = name.trim().toLowerCase();
      const symbolExists = this.symbols.some(
        (s, i) => i !== index && s.name.trim().toLowerCase() === normalizedNewName
      );
      
      if (symbolExists) {
        throw new Error('این نماد قبلاً ثبت شده است');
      }
    }
    
    // به‌روزرسانی اطلاعات نماد
    this.symbols[index] = { 
      name: name.trim(), 
      currentPrice: currentPrice !== null ? currentPrice : null
    };
    this.saveToStorage();
  }

  // حذف نماد از لیست
  deleteSymbol(index) {
    this.symbols.splice(index, 1);
    this.saveToStorage();
  }

  // دریافت اطلاعات یک نماد خاص
  getSymbol(index) {
    return this.symbols[index];
  }

  // دریافت لیست تمام نمادها
  getAllSymbols() {
    return this.symbols;
  }

  // دریافت قیمت فعلی یک نماد
  getCurrentPrice(symbolName) {
    const symbol = this.symbols.find(s => s.name === symbolName);
    return symbol ? symbol.currentPrice : null;
  }
}