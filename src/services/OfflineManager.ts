import { Product, Transaction } from '../types/pos.types';

class OfflineManager {
  private static instance: OfflineManager;
  private readonly PRODUCTS_KEY = 'pos_products';
  private readonly TRANSACTIONS_KEY = 'pos_transactions';

  private constructor() {
    // Initialize storage if needed
    if (!localStorage.getItem(this.PRODUCTS_KEY)) {
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.TRANSACTIONS_KEY)) {
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify([]));
    }
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  // Product Management
  async getProducts(): Promise<Product[]> {
    const products = localStorage.getItem(this.PRODUCTS_KEY);
    return products ? JSON.parse(products) : [];
  }

  async saveProduct(product: Product): Promise<void> {
    const products = await this.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }

    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
  }

  // Transaction Management
  async getTransactions(): Promise<Transaction[]> {
    const transactions = localStorage.getItem(this.TRANSACTIONS_KEY);
    return transactions ? JSON.parse(transactions) : [];
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
  }

  // Stock Management
  async updateStock(productId: string, quantity: number): Promise<void> {
    const products = await this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
      product.stock += quantity;
      await this.saveProduct(product);
    }
  }
}