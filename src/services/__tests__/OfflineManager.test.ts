import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineManager } from '../OfflineManager';
import { Product, Transaction } from '../../types/pos.types';

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = value.toString();
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn((index) => ''),
    };

    // Mock IndexedDB
    const mockIndexedDB = {
      open: vi.fn(),
      deleteDatabase: vi.fn(),
    };
    
    global.indexedDB = mockIndexedDB as unknown as IDBFactory;
    offlineManager = OfflineManager.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('offline sync', () => {
    it('should persist products to storage', async () => {
      const testProduct: Product = {
        id: '1',
        name: 'Test Product',
        price: 9.99,
        sku: 'TEST001',
        stock: 10
      };

      await offlineManager.saveProduct(testProduct);
      const products = await offlineManager.getProducts();
      
      expect(products).toHaveLength(1);
      expect(products[0]).toEqual(testProduct);
    });

    it('should persist transactions to storage', async () => {
      const testTransaction: Transaction = {
        id: '1',
        items: [{
          productId: '1',
          quantity: 1,
          price: 9.99,
          subtotal: 9.99
        }],
        total: 9.99,
        timestamp: new Date(),
        status: 'completed'
      };

      await offlineManager.saveTransaction(testTransaction);
      const transactions = await offlineManager.getTransactions();
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual(testTransaction);
    });

    it('should fall back to localStorage when IndexedDB fails', async () => {
      const testProduct: Product = {
        id: '1',
        name: 'Test Product',
        price: 9.99,
        sku: 'TEST001',
        stock: 10
      };

      // Simulate IndexedDB failure
      global.indexedDB = undefined as any;
      
      await offlineManager.saveProduct(testProduct);
      const products = await offlineManager.getProducts();
      
      expect(products).toHaveLength(1);
      expect(products[0]).toEqual(testProduct);
      expect(localStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('conflict resolution', () => {
    it('should update existing product when saving with same id', async () => {
      const initialProduct: Product = {
        id: '1',
        name: 'Initial Product',
        price: 9.99,
        sku: 'TEST001',
        stock: 10
      };

      const updatedProduct: Product = {
        ...initialProduct,
        name: 'Updated Product',
        price: 19.99
      };

      await offlineManager.saveProduct(initialProduct);
      await offlineManager.saveProduct(updatedProduct);
      
      const products = await offlineManager.getProducts();
      expect(products).toHaveLength(1);
      expect(products[0]).toEqual(updatedProduct);
    });

    it('should correctly update stock quantities', async () => {
      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 9.99,
        sku: 'TEST001',
        stock: 10
      };

      await offlineManager.saveProduct(product);
      await offlineManager.updateStock('1', -5);
      
      const products = await offlineManager.getProducts();
      expect(products[0].stock).toBe(5);
    });

    it('should sync data between IndexedDB and localStorage', async () => {
      const testProduct: Product = {
        id: '1',
        name: 'Test Product',
        price: 9.99,
        sku: 'TEST001',
        stock: 10
      };

      await offlineManager.saveProduct(testProduct);
      
      // Verify data is in localStorage
      const localStorageData = localStorage.getItem('pos_products');
      expect(localStorageData).toBeTruthy();
      expect(JSON.parse(localStorageData!)[0]).toEqual(testProduct);
    });
  });
});