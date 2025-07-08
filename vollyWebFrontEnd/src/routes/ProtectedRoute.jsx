// import { Navigate } from 'react-router-dom';

// export default function ProtectedRoute({ children }) {
//   const isLoggedIn = !!localStorage.getItem('user');
//   return isLoggedIn ? children : <Navigate to="/login" replace />;
// }


import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}