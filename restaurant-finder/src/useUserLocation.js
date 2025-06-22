import { useEffect, useState } from "react"

export default function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [permissionAsked, setPermissionAsked] = useState(false)

  useEffect(() => {
    if (!permissionAsked) {
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
