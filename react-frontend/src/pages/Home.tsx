import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home">
      <h1>Welcome to Aspire Sample</h1>
      {isAuthenticated ? (
        <p>Hello, <strong>{user?.username}</strong>! You are logged in.</p>
      ) : (
        <p>Please login to access Weather and Product data.</p>
      )}
    </div>
  );
}
