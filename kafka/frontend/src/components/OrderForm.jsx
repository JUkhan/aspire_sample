import { useState, useEffect } from 'react';
import { createOrder, getInventory } from '../api/orders';

const OrderForm = ({ onOrderCreated }) => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    customerId: '',
    customerEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const result = await getInventory();
      if (result.success) {
        setInventory(result.inventory);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.productId === product.product_id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.product_id,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!customerInfo.customerId || !customerInfo.customerEmail) {
      setError('Please fill in customer information');
      return;
    }

    if (cart.length === 0) {
      setError('Please add items to cart');
      return;
    }

    setLoading(true);

    try {
      const result = await createOrder({
        customerId: customerInfo.customerId,
        customerEmail: customerInfo.customerEmail,
        items: cart,
      });

      if (result.success) {
        setSuccess(`Order created! ID: ${result.order.id}`);
        setCart([]);
        setCustomerInfo({ customerId: '', customerEmail: '' });
        if (onOrderCreated) {
          onOrderCreated(result.order);
        }
      } else {
        setError(result.message || 'Failed to create order');
      }
    } catch (err) {
      setError('Failed to create order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Create New Order</h2>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Customer ID"
          value={customerInfo.customerId}
          onChange={(e) =>
            setCustomerInfo({ ...customerInfo, customerId: e.target.value })
          }
          className="border rounded px-3 py-2"
        />
        <input
          type="email"
          placeholder="Customer Email"
          value={customerInfo.customerEmail}
          onChange={(e) =>
            setCustomerInfo({ ...customerInfo, customerEmail: e.target.value })
          }
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Product List */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Available Products</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {inventory.map((product) => (
            <button
              key={product.product_id}
              onClick={() => addToCart(product)}
              className="border rounded p-2 text-left hover:bg-gray-50 transition"
            >
              <div className="font-medium text-sm truncate">{product.name}</div>
              <div className="text-green-600 font-bold">${product.price}</div>
              <div className="text-xs text-gray-500">
                Stock: {product.quantity - product.reserved}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="mb-4 border rounded p-3">
          <h3 className="font-semibold mb-2">Cart</h3>
          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-500 ml-2">${item.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="text-red-500 ml-2"
                >
                  X
                </button>
              </div>
            </div>
          ))}
          <div className="mt-3 text-right font-bold text-lg">
            Total: ${getTotal()}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || cart.length === 0}
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Creating Order...' : 'Place Order'}
      </button>
    </div>
  );
};

export default OrderForm;
