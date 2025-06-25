import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { savedRestaurants } from '../lib/supabase'
import { Heart } from 'lucide-react'

const SaveRestaurantButton = ({ restaurant }) => {
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && restaurant) {
      checkIfSaved()
    }
  }, [user, restaurant])

  const checkIfSaved = async () => {
    try {
      const { isSaved: saved, error } = await savedRestaurants.isSaved(user.id, restaurant.id)
      if (error) throw error
      setIsSaved(saved)
    } catch (error) {
      console.error('Error checking if restaurant is saved:', error)
    }
  }

  const handleToggleSave = async () => {
    if (!user) {
      alert('Please sign in to save restaurants')
      return
    }

    setLoading(true)
    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await savedRestaurants.remove(user.id, restaurant.id)
        if (error) throw error
        setIsSaved(false)
      } else {
        // Add to saved
        const { error } = await savedRestaurants.add(user.id, restaurant)
        if (error) throw error
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error toggling save:', error)
      alert('Error saving restaurant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
        isSaved
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isSaved ? 'Remove from saved' : 'Save restaurant'}
    >
      <Heart
        className={`h-4 w-4 ${isSaved ? 'fill-current' : ''} ${
          loading ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-sm font-medium">
        {loading ? '...' : isSaved ? 'Saved' : 'Save'}
      </span>
    </button>
  )
}

export default SaveRestaurantButton 