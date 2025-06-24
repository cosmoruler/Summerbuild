import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Fix for default marker icon issues in many setups
// This ensures the marker icons display correctly
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Singapore's expanded geographical bounds (SW and NE corners)
const singaporeBounds = [
  [1.2000, 103.6000], // Expanded Southwest
  [1.4850, 104.1000], // Expanded Northeast
];

// Use Vite's public base URL for static assets
const baseUrl = import.meta.env.BASE_URL;
const redPinIcon = new L.Icon({
  iconUrl: `${baseUrl}red-pin.svg`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});
const bluePinIcon = new L.Icon({
  iconUrl: `${baseUrl}blue-pin.svg`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function RecenterMap({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15); // 15 is about 1km radius
    }
  }, [userLocation, map]);
  return null;
}

/**
 * Map component to display restaurant locations and user location.
 * Restricts map to Singapore's geographical area.
 * @param {Object[]} restaurants - Array of restaurant objects with lat/lon.
 * @param {Object} userLocation - User's location { lat, lng }.
 * @param {Object} selectedPlace - Currently selected place.
 * @param {Function} setSelectedPlace - Function to set the selected place.
 * @param {boolean} searchPerformed - Indicates if a search has been performed.
 */
export default function RestaurantMap({ restaurants, userLocation, selectedPlace, setSelectedPlace, searchPerformed }) {
  // Center the map on the user's location, or a default if not available
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [1.3521, 103.8198]; // Default: Singapore

  return (
    // MapContainer is the main map wrapper from react-leaflet
    <MapContainer
      center={center}
      zoom={15}
      minZoom={11}
      maxZoom={18}
      className="w-full h-80 sm:h-[400px] rounded-lg"
      maxBounds={singaporeBounds}
      maxBoundsViscosity={1.0} // Prevents panning outside Singapore
    >
      <RecenterMap userLocation={userLocation} />
      {/* OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Only render restaurant markers if a search has been performed */}
      {searchPerformed && Array.isArray(restaurants) && restaurants
        .filter(place => typeof place.lat === 'number' && typeof place.lon === 'number' && !isNaN(place.lat) && !isNaN(place.lon))
        .map((place, idx) => (
          <Marker
            key={place.name + idx}
            position={[place.lat, place.lon]}
            icon={selectedPlace === place.name ? bluePinIcon : redPinIcon}
            eventHandlers={{
              click: () => setSelectedPlace(place.name),
            }}
          >
            <Popup>
              <div className="font-sans text-gray-900" style={{ minWidth: 120 }}>
                <strong className="block text-base mb-1">{place.name}</strong>
                <div className="flex items-center text-yellow-500 text-sm mb-1">
                  <span>★</span>
                  <span className="ml-1 font-medium text-gray-800">{place.rating || 'N/A'}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">{place.cuisine}</div>
                <Button size="sm" variant="outline">Details</Button>
              </div>
            </Popup>
          </Marker>
        ))}
      {/* User location marker (always shown if available) */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          shadowSize: [41, 41],
        })}>
          <Popup>You are here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
} 