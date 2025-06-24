import { useEffect, useState, useRef } from "react"

/**
 * Custom hook to get the user's location, prompting only once per session.
 * Returns the location object or null.
 */
export default function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [permissionAsked, setPermissionAsked] = useState(false)
  const requestedRef = useRef(false) // Prevent multiple prompts per session

  useEffect(() => {
    // Only prompt if not already asked in this session
    if (!permissionAsked && !requestedRef.current) {
      requestedRef.current = true // Mark as requested for this session
      const shouldEnable = window.confirm("Enable location access to show nearby restaurants?")
      setPermissionAsked(true)
      if (shouldEnable && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (error) => {
            console.error("Geolocation error:", error)
          }
        )
      }
    }
  }, [permissionAsked])

  return location
}
