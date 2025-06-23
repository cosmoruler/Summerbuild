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
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    query: str = Query(None, description="User preference query"),
    top_n: int = Query(3, description="Number of recommendations")
):
    places = client.search_nearby((lat, lon), radius=3000, places_type=["amenity=restaurant", "amenity=cafe"], limit=25)
    raw_recommendations = recommender.get_recommendations(places, query=query, top_n=top_n)
    recommendations = recommender._clean_recommendations(raw_recommendations)
    return {"results": recommendations}