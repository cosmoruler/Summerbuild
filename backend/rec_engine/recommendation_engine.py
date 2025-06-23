import requests
import numpy as np
import time
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass, field
import json

# Geopy for geocoding
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter


# Sentence Transformer for modelling
from sentence_transformers import SentenceTransformer

# sklearn for cosine similarity
from sklearn.metrics.pairwise import cosine_similarity

class Geocoder:
    """Handles address to coordinates conversion and vice versa"""
    
    def __init__(self, user_agent: str = "recommendation_engine"):
        self.geolocator = Nominatim(user_agent=user_agent)
        
        # Rate limited geocoding to respect API limits
        self._geocode = RateLimiter(
            self.geolocator.geocode,
            min_delay_seconds=1.0,
            error_wait_seconds=2.0,
            max_retries=2,
            swallow_exceptions=False
        )

        self._reverse_geocode = RateLimiter(
            self.geolocator.reverse,
            min_delay_seconds=1.0,
            error_wait_seconds=2.0,
            max_retries=2,
            swallow_exceptions=False
        ) 

    def geocode(self, query: str, limit: int = 1):
        """Convert address to coordinates and address details"""
        try:
            location = self._geocode(query, exactly_one=True, addressdetails=True)
            if not location:
                return None
                        
            return {
                'lat': location.latitude,
                'lon': location.longitude,
                'display_name': location.address,
            }
            
        except Exception as e:
            print(f'❌ Geocoding error: {e}')
            return None
    
    def reverse_geocode(self, lat: float, lon: float):
        """Convert coordinates to address details"""
        try:
            location = self._reverse_geocode((lat, lon), exactly_one=True, addressdetails=True)
            if not location:
                return None

            address = location.raw['address'] if hasattr(location, 'raw') and 'address' in location.raw else {}
                
            return {
                'display_name': location.address,
                'address': address
            }
            
        except Exception as e:
            print(f'❌ Reverse geocoding error: {e}')
            return None

class LocationManager:
    """Handles different types of location inputs"""
    
    def __init__(self):
        self.geocoder = Geocoder()
        
    def process_location_input(self, location_input: Union[str, Tuple[float, float], Dict]) -> Optional[Dict]:
        """Process various location input formats"""
        
        # Handle coordinate tuples/lists
        if isinstance(location_input, (tuple, list)) and len(location_input) == 2:
            lat, lon = map(float, location_input)
            return self._create_location_result(lat, lon, "manual_coordinates")
            
        # Handle address strings
        elif isinstance(location_input, str):
            # Try to parse as coordinates first
            try:
                if ',' in location_input:
                    lat, lon = map(float, (x.strip() for x in location_input.split(',')))
                    return self._create_location_result(lat, lon, "parsed_coordinates")
            except (ValueError, AttributeError):
                pass
                
            # If not coordinates, treat as address string
            result = self.geocoder.geocode(location_input)
            if result:
                return self._create_location_result(
                    result['lat'], 
                    result['lon'], 
                    "geocoded_address",
                    display_name=result.get('display_name')
                )
            
        # Handle dict with lat/lon
        elif isinstance(location_input, dict):
            if 'lat' in location_input and 'lon' in location_input:
                return self._create_location_result(
                    float(location_input['lat']), 
                    float(location_input['lon']), 
                    "dict_coordinates",
                    display_name=location_input.get('display_name')
                )
                
        return None
    
    def _create_location_result(self, lat: float, lon: float, source: str, display_name: str = None) -> Dict:
        """Create a standardized location result dictionary"""
        if not display_name:
            # Try to get display name via reverse geocoding
            reverse = self.geocoder.reverse_geocode(lat, lon)
            display_name = reverse['display_name'] if reverse else f"{lat}, {lon}"
            
        return {
            'lat': lat,
            'lon': lon,
            'display_name': display_name,
            'source': source
        }


def test_geocoder():
    # Initialize the geocoder
    geocoder = Geocoder()
    
    # Test 1: Forward geocoding (address to coordinates)
    print("Testing forward geocoding...")
    test_addresses = [
        "Marina Bay Sands, Singapore",
        "Tokyo Tower, Japan",
        "Eiffel Tower, Paris"
    ]
    
    for address in test_addresses:
        print(f"\nGeocoding address: {address}")
        result = geocoder.geocode(address)
        if result:
            print("✅ Success!")
            print(f"Coordinates: {result['lat']}, {result['lon']}")
            print(f"Display name: {result['display_name']}")
            
            # Test reverse geocoding with these coordinates
            print("\nTesting reverse geocoding...")
            reverse_result = geocoder.reverse_geocode(result['lat'], result['lon'])
            if reverse_result:
                print("✅ Reverse geocoding successful!")
                print(f"Address: {reverse_result['display_name']}")
            else:
                print("❌ Reverse geocoding failed!")
                
            # Add a small delay between tests to respect rate limits
            time.sleep(1)
        else:
            print(f"❌ Geocoding failed for address: {address}")


class PlacesAPIClient:
    def __init__(self,overpass_endpoint: str= 'https://overpass-api.de/api/interpreter'):
        self.overpass_endpoint=overpass_endpoint
        self.geocoder=Geocoder()



    def _build_overpass_query(self, lat: float, lon: float, radius: int, places_type: List[str], limit: int) -> str:
        """Constructs raw Overpass QL query string"""
        if not places_type:
            places_type = ['amenity', 'tourism', 'shop', 'leisure']
        
        # Build individual queries for each place type
        queries = []
        for place in places_type:
            if '=' in place:
                k, v = place.split('=', 1)
                tag_filter = f'["{k}"="{v}"]'
            else:
                raise ValueError('Input should be : amenity=restaurant or amenity=cafe')
            
            queries.append(f"""
            node(around:{radius},{lat},{lon}){tag_filter};
            way(around:{radius},{lat},{lon}){tag_filter};
            relation(around:{radius},{lat},{lon}){tag_filter};
            """)
        
        # Combine all queries with union
        query_parts = [
            "[out:json][timeout:25];",
            "(",
            *queries,
            ");",
            f"out body {limit};",
            ">;",
            "out skel qt;"
        ]
        
        return "\n".join(query_parts)

    def search_nearby(self, location: Union[str, Tuple[float, float]], radius: int = 1000, places_type: List[str] = None, limit: int = 50):
        """Entry method: geocodes and runs the query, returns List[Dict] else returns [] if error"""
        if isinstance(location, str):
            geocode_result = self.geocoder.geocode(location)
            if not geocode_result:
                raise ValueError(f"Could not geocode location: {location}")
            lat, lon = float(geocode_result['lat']), float(geocode_result['lon'])
            print(f'Successfully geocoded forward location: {location} to coordinates lat/lon: {lat}/{lon}')
        elif isinstance(location, (tuple, list)) and len(location) == 2:
            lat, lon = map(float, location)
        else:
            raise ValueError("Location must be an address string or (lat, lon) tuple")

        query = self._build_overpass_query(lat, lon, radius, places_type or [], limit)
        #print("Generated query:\n", query)  # debuug
        
        try:
            response = requests.post(
                self.overpass_endpoint,
                data=query,
                headers={'Content-Type': 'text/plain'}
            )
            response.raise_for_status()
            data = response.json()
            if 'elements' not in data:
                print("No elements found in response")
                return []
            return self._process_elements(data['elements'])
        except Exception as e:
            print(f'Error with Overpass API: {e}')
            if hasattr(e, 'response') and e.response is not None:
                try:
                    print(f'Response: {e.response.text}')
                except:
                    print("Could not decode error response")
            return []



    def _process_elements(self,elements: List[Dict]):
        places=[]
        for element in elements:
            #skip blanks
            if 'tags' not in element or 'name' not in element['tags']:
                continue

            place = {
                'id': f"{element['type']}_{element['id']}",
                'name': element['tags']['name'],
                'type': self._get_place_type(element['tags']),
                'tags': element['tags'],
                'lat': element.get('lat'),
                'lon': element.get('lon')
            }
                

            if 'center' in element:
                place.update({
                    'lat': element['center'].get('lat'),
                    'lon': element['center'].get('lon')
                })

            #add address
            hmap={}
            tags=element.get('tags','')
            #add additional features here
            for key in ['addr:street', 'addr:housename','addr:housenumber','addr:postcode', 'addr:city','name']:
                if key in tags:
                    hmap[key]=tags[key]
            if hmap:
                place['address']=hmap
            places.append(place)

        return places
    
    def _get_place_type(self,tags: Dict[str,str]):
        """determine the main features of place from tags, returns Dict[str,str]"""
        core_features=['cuisine','amenity','name','website','indoor_seating','outdoor_seating','indoor_seating','wheelchair','takeaway']
        features={}
        for tag in core_features:
            if tag in tags:
                features[tag] = tags[tag]
        return features
        
def test_places_api_client():
    print("\nTesting PlacesAPIClient...")
    
    # Initialize the client
    client = PlacesAPIClient()
    
    # Test 1: Search by address string
    print("\nTest 1: Searching by address...")
    address = "Marina Bay Sands, Singapore"
    print(f"Searching for places near: {address}")
    results = client.search_nearby(
        location=address,
        radius=3000,  # 1km radius
        places_type=["amenity=restaurant", "amenity=cafe"],  # Search for restaurants and cafes
        limit=10  
    )
    print(f"Found {len(results)} places:")
    print('raw results')
    print(results)
    print('--------------------------------------------------------------------------------')
    for i, place in enumerate(results, 1):
        print(f"\n{i}. {place.get('name')}")
        print(f"   Type: {place.get('type')}")
        print(f"   Address: {place.get('address', {}).get('addr:street', 'N/A')}, {place.get('address', {}).get('addr:city', 'N/A')}")
        print(f"   Coordinates: {place.get('lat')}, {place.get('lon')}")
    
    # Test 2: Search by coordinates
    print("\nTest 2: Searching by coordinates...")
    # Coordinates for Marina Bay Sands
    coords = (1.2837, 103.8607)
    print(f"Searching for places near coordinates: {coords}")
    results = client.search_nearby(
        location=coords,
        radius=3000,  
        places_type=["amenity=restaurant"],  
        limit=10  
    )
    print(f"Found {len(results)} places:")
    for i, place in enumerate(results, 1):
        print(f"\n{i}. {place.get('name')}")
        print(f"   Type: {place.get('type')}")
        print(f"   Address: {', '.join(str(v) for k, v in place.get('address', {}).items())}")


class PlaceRecommender:
    def __init__(self, model_name='all-mpnet-base-v2'):
        self.model = SentenceTransformer(model_name)
    
    def _create_place_description(self, place: Dict) -> str:
        """Create a descriptive text for each place from its data"""
        #feel free to add wtv u want
        name = place.get('name', '')
        cuisine = place.get('type', {}).get('cuisine', '')
        amenity = place.get('type', {}).get('amenity', 'place')
        
        # Get address components, feel free to add wtv u want
        addr = place.get('address', {})
        address_parts = [
            addr.get('addr:housenumber', ''),
            addr.get('addr:street', ''),
            addr.get('addr:city', '')
        ]
        address = ' '.join(filter(None, address_parts))
        
        # Combine all relevant information
        description = f"{name} {cuisine} {amenity} {address}".lower()
        return description

    def get_recommendations(self, places: List[Dict], query: str = None, top_n: int = 3) -> List[Dict]:

        if query is None:
            # Return first N places with default score
            return [dict(place, similarity_score=1.0) for place in places[:top_n]]
        
       
        query_embedding = self.model.encode(query, convert_to_tensor=True).unsqueeze(0)  
        
      
        place_descriptions = [self._create_place_description(place) for place in places]
        place_embeddings = self.model.encode(place_descriptions, convert_to_tensor=True) 

        similarity_scores = cosine_similarity(query_embedding.cpu().numpy(), place_embeddings.cpu().numpy())[0] 
       
        top_indices = np.argsort(similarity_scores)[::-1][:top_n]
    
        results= [
            dict(places[idx], similarity_score=float(similarity_scores[idx]))
            for idx in top_indices
        ]
        #adjust accordingly
        return results
    
    def _clean_recommendations(self, results: List[Dict]):
        """Preprocess results into readable format"""
        res=[]
        #add wtv u want
        for place in results:   
            place_info = {
                'name': place.get('name', 'Unknown'),
                'cuisine': place.get('type', {}).get('cuisine', 'Not specified'),
                'similarity_score': place.get('similarity_score', 0),
                'address': place.get('address', {})}
            res.append(place_info)
        return res
    




if __name__ == "__main__":
    #test_geocoder()
    #test_places_api_client()
    #example usage
    client=PlacesAPIClient()
    places=client.search_nearby("Marina Bay Sands", radius=3000, places_type=["amenity=restaurant", "amenity=cafe"], limit=25) 
    recommender=PlaceRecommender()
    raw_recommendations=recommender.get_recommendations(places, query="I'm looking for a seafood restaurant with outdoor seating", top_n=3) 
    recommendations=recommender._clean_recommendations(raw_recommendations)
    print(recommendations)
    #output
    #[{'name': 'Red ahous', 'cuisine': 'seafood', 'similarity_score': 0.5781137943267822, 'address': {'name': 'Red ahous'}}, {'name': 'TungLok Seafood', 'cuisine': 'seafood', 'similarity_score': 0.5748628377914429, 'address': {'addr:street': 'Marina Gardens Drive', 'addr:housenumber': '18', 'addr:postcode': '018593', 'addr:city': 'Singapore', 'name': 'TungLok Seafood'}}, {'name': 'Jumbo Seafood', 'cuisine': 'seafood', 'similarity_score': 0.5634016394615173, 'address': {'addr:street': 'Upper Circular Road', 'addr:housenumber': '20', 'addr:postcode': '058416', 'addr:city': 'Singapore', 'name': 'Jumbo Seafood'}}]

