import { OfflineManager } from './services/OfflineManager';
import { Product } from './types/pos.types';

export class InventoryManager {
  private offlineManager: OfflineManager;

  constructor() {
    this.offlineManager = OfflineManager.getInstance();
  }

  async addProduct(product: Product): Promise<void> {
    await this.offlineManager.saveProduct(product);
  }

  async getProduct(productId: string): Promise<Product | undefined> {
    const products = await this.offlineManager.getProducts();
    return products.find(p => p.id === productId);
  }

  async getAllProducts(): Promise<Product[]> {
    return await this.offlineManager.getProducts();
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.offlineManager.updateStock(productId, quantity);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.offlineManager.getProducts();
    const searchTerm = query.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm)
    );
  }
}