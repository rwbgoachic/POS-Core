import { useState, useEffect } from 'react'
import './App.css'
import { Product } from './types/pos.types'

function App() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    // Initialize with some sample data
    const sampleProduct: Product = {
      id: '1',
      name: 'Sample Product',
      price: 9.99,
      sku: 'SAMPLE001',
      stock: 10
    }
    setProducts([sampleProduct])
  }, [])

  return (
    <div className="pos-container">
      <header>
        <h1>POS System</h1>
      </header>
      
      <main>
        <section className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>Price: ${product.price}</p>
              <p>Stock: {product.stock}</p>
              <button onClick={() => console.log('Add to cart:', product)}>
                Add to Cart
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App