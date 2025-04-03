export class SymbolManager {
  constructor() {
    this.symbols = JSON.parse(localStorage.getItem('symbols')) || [];
  }

  saveToStorage() {
    localStorage.setItem('symbols', JSON.stringify(this.symbols));
  }

  addSymbol(name, currentPrice = null) {
    if (!name || name.trim() === '') {
      throw new Error('لطفا نام نماد را وارد کنید');
    }
    
    const normalizedNewName = name.trim().toLowerCase();
    const symbolExists = this.symbols.some(
      s => s.name.trim().toLowerCase() === normalizedNewName
    );
    
    if (symbolExists) {
      throw new Error('این نماد قبلاً ثبت شده است');
    }
    
    this.symbols.push({ 
      name: name.trim(), 
      currentPrice: currentPrice !== null ? Math.round(Number(currentPrice)) : null 
    });
    this.saveToStorage();
  }

  updateSymbol(index, name, currentPrice = null) {
    if (!name || name.trim() === '') {
      throw new Error('لطفا نام نماد را وارد کنید');
    }
    
    const normalizedNewName = name.trim().toLowerCase();
    const symbolExists = this.symbols.some(
      (s, i) => i !== index && s.name.trim().toLowerCase() === normalizedNewName
    );
    
    if (symbolExists) {
      throw new Error('این نماد قبلاً ثبت شده است');
    }
    
    this.symbols[index] = { 
      name: name.trim(), 
      currentPrice: currentPrice !== null ? Math.round(Number(currentPrice)) : null 
    };
    this.saveToStorage();
  }

  deleteSymbol(index) {
    this.symbols.splice(index, 1);
    this.saveToStorage();
  }

  getSymbol(index) {
    return this.symbols[index];
  }

  getAllSymbols() {
    return this.symbols;
  }

  getCurrentPrice(symbolName) {
    const symbol = this.symbols.find(s => s.name === symbolName);
    return symbol ? symbol.currentPrice : null;
  }
}