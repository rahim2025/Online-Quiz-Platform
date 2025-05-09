import { Navigate } from 'react-router-dom'
import { authStore } from '../store/useAuthStore'

export const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = authStore()

  if (isCheckingAuth) {
    return <div>Loading...</div>
  }

  if (!authUser) {
    return <Navigate to="/login" />
  }

  return children
}