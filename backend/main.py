#FastAPI entry point
from fastapi import FastAPI, Query
from rec_engine.recommendation_engine import PlacesAPIClient, PlaceRecommender
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
client = PlacesAPIClient()
recommender = PlaceRecommender()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend dev server
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
    print(f"[DEBUG] Found {len(places)} places from Overpass API")
    # Get recommendations using semantic search
    raw_recommendations = recommender.get_recommendations(places, query=query, top_n=top_n*3)  # get more to filter
    print(f"[DEBUG] Got {len(raw_recommendations)} raw recommendations")
    # Clean recommendations for frontend
    recommendations = recommender._clean_recommendations(raw_recommendations)
    print(f"[DEBUG] Cleaned down to {len(recommendations)} recommendations")
    # --- Post-process filtering based on query params ---
    filtered = []
    for place in recommendations:
        # Filter by price level if available and valid
        price = place.get('price_level')
        if price is not None and isinstance(price, str) and '$' in price:
            try:
                price_num = int(price.count('$'))
                if not (price_min <= price_num <= price_max):
                    continue
            except Exception:
                pass  # If price is not in expected format, skip filter
        # If price is missing or not valid, do NOT filter out

        # Filter by rating if available and valid
        rating = place.get('rating')
        if rating is not None and isinstance(rating, (int, float, str)):
            try:
                rating_num = float(rating)
                if not (rating_min <= rating_num <= rating_max):
                    continue
            except Exception:
                pass  # If rating is not a number, skip filter
        # If rating is missing or not valid, do NOT filter out

        # Filter by bookable (e.g., reservation or online booking)
        if bookable:
            tags = place.get('type', {})
            if not (tags.get('reservation') == 'yes' or tags.get('bookable') == 'yes'):
                continue
        filtered.append(place)
    print(f"[DEBUG] Returning {len(filtered[:top_n])} results to frontend")
    # Limit to top_n results after filtering
    filtered = filtered[:top_n]

    return {"results": filtered}