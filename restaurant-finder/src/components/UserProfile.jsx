import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { savedRestaurants } from '../lib/supabase'
import { LogOut, User, Heart, ChevronDown, MapPin, Star, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [savedRestaurantsList, setSavedRestaurantsList] = useState([])
  const [loading, setLoading] = useState(false)
  const buttonRef = useRef(null)
  const [dropdownStyle, setDropdownStyle] = useState({})

  useEffect(() => {
    if (user) {
      loadSavedRestaurants()
    }
  }, [user])

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 320 + window.scrollX, // 320px = dropdown width
        zIndex: 9999,
        minWidth: 320,
        maxWidth: 360,
      })
    }
  }, [isDropdownOpen])

  const loadSavedRestaurants = async () => {
    setLoading(true)
    try {
      const { data, error } = await savedRestaurants.getSaved(user.id)
      if (error) throw error
      setSavedRestaurantsList(data || [])
    } catch (error) {
      console.error('Error loading saved restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 bg-white rounded-full p-2 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {user.email}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {/* Dropdown Menu in Portal */}
      {isDropdownOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            style={{ background: 'transparent' }}
            onClick={() => setIsDropdownOpen(false)}
          />
          {/* Dropdown Content */}
          <div
            className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden"
            style={dropdownStyle}
            tabIndex={-1}
            role="menu"
            aria-label="User menu"
          >
            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">User</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Saved Restaurants */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2"><Heart className="h-4 w-4 text-red-500" /></span>
                  Saved Restaurants
                </h3>
                <span className="text-sm text-gray-500">
                  {savedRestaurantsList.length}
                </span>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : savedRestaurantsList.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedRestaurantsList.slice(0, 3).map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {restaurant.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {restaurant.cuisine && (
                            <span>{restaurant.cuisine}</span>
                          )}
                          {restaurant.rating && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              <span>{restaurant.rating}</span>
                            </div>
                          )}
                          {restaurant.price_level && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 text-green-500 mr-1" />
                              <span>{restaurant.price_level}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {savedRestaurantsList.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{savedRestaurantsList.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No saved restaurants yet
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link to="/profile" className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default UserProfile 