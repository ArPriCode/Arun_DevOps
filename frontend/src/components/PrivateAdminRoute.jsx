import React from 'react'
import { Navigate } from 'react-router-dom'

function PrivateAdminRoute({ children }) {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = userStr ? JSON.parse(userStr) : null

  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" replace />
  }

  return children
}

export default PrivateAdminRoute


