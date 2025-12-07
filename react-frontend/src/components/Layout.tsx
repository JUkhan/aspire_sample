import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">Aspire Sample (React)</Link>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/weather">Weather</Link>
          <Link to="/products">Products</Link>
        </div>
        <div className="nav-auth">
          {isAuthenticated ? (
            <>
              <span>Hello, {user?.username}</span>
              <button onClick={handleLogout} className="btn-link">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
