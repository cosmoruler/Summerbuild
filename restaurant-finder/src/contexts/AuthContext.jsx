import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../lib/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user session
    const getInitialSession = async () => {
      try {
        const { data: { user } } = await auth.getCurrentUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await auth.signUp(email, password)
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await auth.signIn(email, password)
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 