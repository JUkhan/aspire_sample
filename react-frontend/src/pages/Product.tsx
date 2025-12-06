import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productApi } from '../services/api';
import type { Product } from '../types';

export default function Products() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await productApi.getProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h2>Authentication Required</h2>
        <p>Please <Link to="/login">login</Link> to view product data.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="products">
      <h1>Products</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index}>
              <td>{product.name}</td>
              <td>${product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
