import { Product, Transaction } from '../types/pos.types';

export class OfflineManager {
  private static instance: OfflineManager;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'pos_store';
  private readonly DB_VERSION = 1;

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

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
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

  // Product Management
  async getProducts(): Promise<Product[]> {
    await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProduct(product: Product): Promise<void> {
    await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.put(product);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Transaction Management
  async getTransactions(): Promise<Transaction[]> {
    await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const request = store.put(transaction);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Stock Management
  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.get(productId);

      request.onsuccess = () => {
        const product = request.result;
        if (product) {
          product.stock += quantity;
          const updateRequest = store.put(product);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Product not found'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}