import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Restrict client_user to only /route-map and their profile
  if (user.role === 'client_user') {
    const allowedPaths = ['/route-map', `/profile/${user.id}`];
    if (!allowedPaths.includes(location.pathname)) {
      return <Navigate to="/route-map" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
