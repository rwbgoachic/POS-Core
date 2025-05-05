import { Product, Transaction } from '../types/pos.types';

export class OfflineManager {
  private static instance: OfflineManager;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'pos_store';
  private readonly DB_VERSION = 1;
  private readonly STORAGE_KEY_PRODUCTS = 'pos_products';
  private readonly STORAGE_KEY_TRANSACTIONS = 'pos_transactions';

  private constructor() {
    this.initDB();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB initialization failed, falling back to localStorage');
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.syncFromLocalStorage();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDBConnection(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  private async syncFromLocalStorage(): Promise<void> {
    try {
      // Sync products
      const storedProducts = localStorage.getItem(this.STORAGE_KEY_PRODUCTS);
      if (storedProducts) {
        const products = JSON.parse(storedProducts);
        for (const product of products) {
          await this.saveProduct(product);
        }
      }

      // Sync transactions
      const storedTransactions = localStorage.getItem(this.STORAGE_KEY_TRANSACTIONS);
      if (storedTransactions) {
        const transactions = JSON.parse(storedTransactions);
        for (const transaction of transactions) {
          await this.saveTransaction(transaction);
        }
      }
    } catch (error) {
      console.error('Error syncing from localStorage:', error);
    }
  }

  // Product Management
  async getProducts(): Promise<Product[]> {
    await this.ensureDBConnection();
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          const storedProducts = localStorage.getItem(this.STORAGE_KEY_PRODUCTS);
          resolve(storedProducts ? JSON.parse(storedProducts) : []);
        };
      });
    } else {
      const storedProducts = localStorage.getItem(this.STORAGE_KEY_PRODUCTS);
      return storedProducts ? JSON.parse(storedProducts) : [];
    }
  }

  async saveProduct(product: Product): Promise<void> {
    await this.ensureDBConnection();
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.put(product);

        request.onsuccess = () => {
          this.updateLocalStorageProducts();
          resolve();
        };
        request.onerror = () => {
          this.saveProductToLocalStorage(product);
          resolve();
        };
      });
    } else {
      this.saveProductToLocalStorage(product);
    }
  }

  private async saveProductToLocalStorage(product: Product): Promise<void> {
    const products = await this.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    
    localStorage.setItem(this.STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  private async updateLocalStorageProducts(): Promise<void> {
    if (this.db) {
      const products = await this.getProducts();
      localStorage.setItem(this.STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    }
  }

  // Transaction Management
  async getTransactions(): Promise<Transaction[]> {
    await this.ensureDBConnection();
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['transactions'], 'readonly');
        const store = transaction.objectStore('transactions');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          const storedTransactions = localStorage.getItem(this.STORAGE_KEY_TRANSACTIONS);
          resolve(storedTransactions ? JSON.parse(storedTransactions) : []);
        };
      });
    } else {
      const storedTransactions = localStorage.getItem(this.STORAGE_KEY_TRANSACTIONS);
      return storedTransactions ? JSON.parse(storedTransactions) : [];
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    await this.ensureDBConnection();
    if (this.db) {
      return new Promise((resolve, reject) => {
        const dbTransaction = this.db!.transaction(['transactions'], 'readwrite');
        const store = dbTransaction.objectStore('transactions');
        const request = store.put(transaction);

        request.onsuccess = () => {
          this.updateLocalStorageTransactions();
          resolve();
        };
        request.onerror = () => {
          this.saveTransactionToLocalStorage(transaction);
          resolve();
        };
      });
    } else {
      this.saveTransactionToLocalStorage(transaction);
    }
  }

  private async saveTransactionToLocalStorage(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem(this.STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }

  private async updateLocalStorageTransactions(): Promise<void> {
    if (this.db) {
      const transactions = await this.getTransactions();
      localStorage.setItem(this.STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    }
  }

  // Stock Management
  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.ensureDBConnection();
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.get(productId);

        request.onsuccess = () => {
          const product = request.result;
          if (product) {
            product.stock += quantity;
            const updateRequest = store.put(product);
            updateRequest.onsuccess = () => {
              this.updateLocalStorageProducts();
              resolve();
            };
            updateRequest.onerror = () => {
              this.updateStockInLocalStorage(productId, quantity);
              resolve();
            };
          } else {
            reject(new Error('Product not found'));
          }
        };
        request.onerror = () => {
          this.updateStockInLocalStorage(productId, quantity);
          resolve();
        };
      });
    } else {
      await this.updateStockInLocalStorage(productId, quantity);
    }
  }

  private async updateStockInLocalStorage(productId: string, quantity: number): Promise<void> {
    const products = await this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
      product.stock += quantity;
      localStorage.setItem(this.STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } else {
      throw new Error('Product not found');
    }
  }
}