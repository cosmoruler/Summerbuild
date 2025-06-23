import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

/**
 * Map component to display restaurant locations and user location.
 * @param {Object[]} restaurants - Array of restaurant objects with lat/lon.
 * @param {Object} userLocation - User's location { lat, lng }.
 */
export default function RestaurantMap({ restaurants, userLocation }) {
  // Center the map on the user's location, or a default if not available
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [1.3521, 103.8198]; // Default: Singapore

  return (
    // MapContainer is the main map wrapper from react-leaflet
    <MapContainer
      center={center}
      zoom={15}
      className="w-full h-80 sm:h-[400px] rounded-lg"
    >
      {/* OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* User location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
      {/* Restaurant markers */}
      {restaurants.map((r, i) =>
        r.lat && r.lon ? (
          <Marker key={r.name + i} position={[r.lat, r.lon]}>
            <Popup>
              <strong>{r.name}</strong>
              <br />
              {r.cuisine}
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
} 