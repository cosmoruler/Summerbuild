#FastAPI entry point
from fastapi import FastAPI, Query
from rec_engine.recommendation_engine import PlacesAPIClient, PlaceRecommender
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
client = PlacesAPIClient()
recommender = PlaceRecommender()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Or ["*"] for all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/recommend")
def recommend(
    lat: float,
    lon: float,
    query: str = "",
    price_min: int = 1,
    price_max: int = 5,
    rating_min: int = 1,
    rating_max: int = 6,
    bookable: bool = False,
    top_n: int = Query(3, description="Number of recommendations")
):
    # Fetch places from Overpass API
    places = client.search_nearby((lat, lon), radius=3000, places_type=["amenity=restaurant", "amenity=cafe"], limit=50)
    if not places:
        return {"results": []}
    # Get recommendations using semantic search
    raw_recommendations = recommender.get_recommendations(places, query=query, top_n=top_n*3)  # get more to filter
    # Clean recommendations for frontend
    recommendations = recommender._clean_recommendations(raw_recommendations)

# -----------------------------------------------------------
#  Enrich each place with extra fields the frontend can show
# -----------------------------------------------------------
    for place in recommendations:
        tags = place.get("tags", {})  # Overpass tags dict

        # Lat/Lon: insure they’re carried over (in case _clean_recommendations dropped them)
        place["lat"] = place.get("lat") or place.get("latitude")
        place["lon"] = place.get("lon") or place.get("longitude")

        # Opening hours, website, phone
        place["opening_hours"] = tags.get("opening_hours")
        place["website"]        = tags.get("website")
        place["phone"]          = tags.get("phone") or tags.get("contact:phone")

        # Convert “yes” style tags into a compact amenity list
        amenity_keys = ["wifi", "outdoor_seating", "wheelchair", "reservation", "delivery"]
        place["amenities"] = [
            key for key in amenity_keys if tags.get(key) == "yes"
        ]

        # Keep raw tags too (optional, but handy for future tweaks)
        place["tags"] = tags

    # --- Post-process filtering based on query params ---
    filtered = []
    for place in recommendations:
        # Filter by price level if available
        price = place.get('price_level')
        if price is not None:
            # Convert price to a number if possible, otherwise skip filter
            try:
                price_num = int(price.count('$'))
                if not (price_min <= price_num <= price_max):
                    continue
            except Exception:
                pass  # If price is not in expected format, skip filter

        # Filter by rating if available
        rating = place.get('rating')
        if rating is not None:
            try:
                rating_num = float(rating)
                if not (rating_min <= rating_num <= rating_max):
                    continue
            except Exception:
                pass  # If rating is not a number, skip filter

        # Filter by bookable (e.g., reservation or online booking)
        if bookable:
            tags = place.get('tags', {}) 
            if not (tags.get('reservation') == 'yes' or tags.get('bookable') == 'yes'):
                continue

        filtered.append(place)

    # Limit to top_n results after filtering
    filtered = filtered[:top_n]

    return {"results": filtered}