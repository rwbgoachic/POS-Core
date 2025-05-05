export interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}