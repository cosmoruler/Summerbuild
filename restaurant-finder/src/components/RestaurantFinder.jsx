import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Filter, Menu, Search, X } from "lucide-react";
import useRecommendations from "../hooks/useRecommendations"; // Import the custom hook
import RestaurantMap from './RestaurantMap';
import ChoiceChipGroup from "@/components/ui/choicechips";
import UserProfile from './UserProfile';
import SaveRestaurantButton from './SaveRestaurantButton';
import { createPortal } from 'react-dom';

// Dummy Switch component for toggles (replace with your UI lib if available)
function Switch({ checked, onCheckedChange, id }) {
	return (
		<label className="inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				checked={checked}
				onChange={e => onCheckedChange(e.target.checked)}
				id={id}
				className="sr-only peer"
			/>
			<div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-all relative">
				<div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'translate-x-4' : ''}`}></div>
			</div>
		</label>
	);
}

// Define filter options for each category
const amenityTypes = ["Restaurant", "Cafe", "Bar", "Pub", "Biergarten", "Food Court"];
const cuisineList = [
	"Malaysian", "Peranakan", "Seafood", "Shanghainese", "Sichuan", "Singaporean",
	"Southeast Asian", "Taiwanese", "Thai", "Themed", "Vegan", "Vegetarian", "Western"
];
const dietaryOptions = ["Vegan", "Vegetarian", "Gluten Free", "Halal", "Kosher"];
const seatingFeatures = ["Outdoor Seating", "Indoor Seating", "Takeaway", "Delivery", "Drive Through", "Reservation"];
const paymentOptions = ["Credit Card", "Cash"];
const accessibilityOptions = ["Wheelchair Accessible", "Wheelchair Toilet"];
const otherOptions = ["WiFi", "Kids Area", "Pet Friendly", "Live Music", "Organic"];
const priceLevels = ["$", "$$", "$$$", "$$$$", "$$$$$"];

export default function RestaurantFinder({ userLocation }) {
	const [view, setView] = useState("map");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFilters, setSelectedFilters] = useState([]); // All filter labels
	const [showAllCuisines, setShowAllCuisines] = useState(false);
	const [ratingRange, setRatingRange] = useState([1, 6]);
	const [priceRange, setPriceRange] = useState([1, 5]);
	const [bookable, setBookable] = useState(false);
	const [showFilters, setShowFilters] = useState(false); // Controls filter panel for both mobile and desktop
	const [filtersCollapsed, setFiltersCollapsed] = useState(false); // For desktop collapse
	const { results, loading, error } = useRecommendations(
		userLocation,
		searchTerm,
		priceRange,
		ratingRange,
		bookable
	);
	const [selectedPlace, setSelectedPlace] = useState(null);
	const [searchPerformed, setSearchPerformed] = useState(false);
	const autoSearchedRef = useRef(false);
	const [priceValue, setPriceValue] = useState("$");
    const [reviewScore, setReviewScore] = useState(1);

	// Count the number of restaurants for each cuisine in the current results
	const cuisineCounts = results.reduce((acc, restaurant) => {
		const cuisine = restaurant.cuisine || "Not specified";
		acc[cuisine] = (acc[cuisine] || 0) + 1;
		return acc;
	}, {});

	// Helper: Add or remove a filter label from the search bar and state
	const toggleFilter = (label) => {
		let newFilters;
		if (selectedFilters.includes(label)) {
			// Remove label from selected filters
			newFilters = selectedFilters.filter(f => f !== label);
		} else {
			// Add label to selected filters
			newFilters = [...selectedFilters, label];
		}
		setSelectedFilters(newFilters);
		// Update search bar: remove all filter labels, then append new ones
		let baseTerm = searchTerm;
		[
			...amenityTypes,
			...cuisineList,
			...dietaryOptions,
			...seatingFeatures,
			...paymentOptions,
			...accessibilityOptions,
			...otherOptions,
			...priceLevels
		].forEach(f => {
			baseTerm = baseTerm.replace(new RegExp(`\\b${f}\\b`, 'gi'), '').trim();
		});
		const filterText = newFilters.join(' ');
		setSearchTerm((baseTerm + ' ' + filterText).trim());
	};

	// Cuisine show more/less logic
	const visibleCuisines = showAllCuisines ? cuisineList : cuisineList.slice(0, 6);

	// Auto-search nearby amenities on initial load if userLocation is available and no search has been performed
	useEffect(() => {
		if (
			userLocation &&
			!searchPerformed &&
			!autoSearchedRef.current
		) {
			// Set a default search term or filters for nearby amenities
			setSearchTerm(""); // Empty search term
			setSelectedFilters(["Restaurant", "Cafe"]); // Default amenity types
			setPriceRange([1, 5]);
			setRatingRange([1, 6]);
			setBookable(false);
			autoSearchedRef.current = true;
		}
	}, [userLocation, searchPerformed]);

	// Update searchPerformed when user searches or changes filters
	useEffect(() => {
		// Consider a search performed if searchTerm is not empty or any filters are set
		if (
			(searchTerm && searchTerm.trim() !== '') ||
			selectedFilters.length > 0 ||
			priceRange[0] !== 1 || priceRange[1] !== 5 ||
			ratingRange[0] !== 1 || ratingRange[1] !== 6 ||
			bookable
		) {
			setSearchPerformed(true);
		} else {
			setSearchPerformed(false);
		}
	}, [searchTerm, selectedFilters, priceRange, ratingRange, bookable]);

	const getRestaurantId = (restaurant) => {
		return restaurant.id ||
			(restaurant.name && restaurant.lat && restaurant.lon
				? `${restaurant.name}_${restaurant.lat}_${restaurant.lon}`
				: null);
	};

	const handleToggleSave = async (restaurant) => {
		if (!user) {
			alert('Please sign in to save restaurants');
			return;
		}

		const restaurantId = getRestaurantId(restaurant);
		if (!restaurantId) {
			alert('Cannot save: restaurant has no unique identifier.');
			return;
		}

		setLoading(true);
		try {
			console.log('Saving restaurant:', restaurant);
			if (isSaved) {
				const { error } = await savedRestaurants.remove(user.id, restaurantId);
				if (error) throw error;
				setIsSaved(false);
			} else {
				const { error } = await savedRestaurants.add(user.id, { ...restaurant, id: restaurantId });
				if (error) throw error;
				setIsSaved(true);
			}
		} catch (error) {
			console.error('Error toggling save:', error);
			alert('Error saving restaurant. ' + (error?.message || 'Please try again.'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col max-w-7xl mx-auto p-2 sm:p-4 w-full">
			{/* Header with User Profile */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex-1" />
				<UserProfile />
			</div>

			{/* Top Search Bar with Menu and Search Icons */}
			<div className="w-full max-w-2xl mx-auto mt-4 mb-2">
				<div className="flex items-center bg-white rounded-2xl shadow px-4 py-2 w-full">
					{/* Menu Icon */}
					<button className="text-red-500 mr-2" onClick={() => setShowFilters(v => !v)} aria-label="Toggle filters">
						<Menu size={24} />
					</button>
					{/* Search Input */}
					<input
						type="text"
						className="flex-1 bg-transparent outline-none text-base px-2"
						placeholder="Search restaurants..."
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
					{/* Clear (cross) button - only show if search or filters are active */}
					{(searchTerm || selectedFilters.length > 0 || priceRange[0] !== 1 || priceRange[1] !== 5 || ratingRange[0] !== 1 || ratingRange[1] !== 6 || bookable) && (
						<button
							className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
							aria-label="Clear search and filters"
							onClick={() => {
								setSearchTerm("");
								setSelectedFilters([]);
								setPriceRange([1, 5]);
								setRatingRange([1, 6]);
								setBookable(false);
							}}
							tabIndex={0}
						>
							<X size={22} />
						</button>
					)}
					{/* Search Icon */}
					<button className="text-red-500 ml-2">
						<Search size={24} />
					</button>
				</div>
			</div>

			{/* Map/List Toggle as pill buttons below search bar */}
			<div className="w-full max-w-2xl mx-auto flex justify-between mt-2 mb-4">
				<button
					className={`flex-1 py-2 rounded-l-2xl text-center font-semibold transition border border-r-0 border-gray-200
						${view === "map" ? "bg-red-100 text-red-500" : "bg-white text-gray-500"}`}
					onClick={() => setView("map")}
				>
					Map
				</button>
				<button
					className={`flex-1 py-2 rounded-r-2xl text-center font-semibold transition border border-l-0 border-gray-200
						${view === "list" ? "bg-red-100 text-red-500" : "bg-white text-gray-500"}`}
					onClick={() => setView("list")}
				>
					List
				</button>
			</div>

			{/* Main Content (Map/List) */}
			<div className="flex-1 flex flex-col h-0">
				{view === "map" ? (
					<div style={{ height: "80vh" }}>
						<RestaurantMap
							restaurants={results}
							userLocation={userLocation}
							selectedPlace={selectedPlace}
							setSelectedPlace={setSelectedPlace}
							searchPerformed={searchPerformed}
						/>
					</div>
				) : (
					<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
						{loading && <p>Loading...</p>}
						{error && <p className="text-red-500">{error}</p>}
						{/* Show a friendly message if no places are found */}
						{!loading && !error && results.length === 0 && (
							<div className="col-span-full flex flex-col items-center justify-center py-16">
								{/* Icon (e.g., map pin with a question mark) */}
								<svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="mb-4 text-gray-300"><circle cx="24" cy="24" r="22" stroke="#E53E3E" strokeWidth="3" fill="#FFF5F5"/><path d="M24 32v-2m0-12a4 4 0 0 1 4 4c0 2-2 3-2 3s-2 1-2 3" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="36" r="1.5" fill="#E53E3E"/></svg>
								<h2 className="text-lg font-semibold text-gray-700 mb-2">No places found</h2>
								<p className="text-gray-500 text-sm text-center max-w-xs">Try adjusting your search, filters, or zooming out to find more restaurants and cafes in the area.</p>
							</div>
						)}
						{results.map((restaurant, i) => (
							<Card
								key={restaurant.name + i}
								className={`p-4 shadow-md rounded-xl w-full cursor-pointer transition border-2 bg-white text-gray-900 font-sans ${
									selectedPlace === restaurant.name ? 'border-red-500 ring-2 ring-red-200' : 'border-transparent'
								}`}
								onClick={() => setSelectedPlace(restaurant.name)}
							>
								<div className="flex items-center">
									{/* Thumbnail or placeholder */}
									<img
										src={restaurant.image || '/placeholder.jpg'}
										alt={restaurant.name}
										className="w-16 h-16 rounded-lg object-cover mr-4 bg-gray-100"
									/>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold text-lg truncate">{restaurant.name}</h3>
										<div className="flex items-center text-yellow-500 text-sm mt-1">
											<span>★</span>
											<span className="ml-1 font-medium text-gray-800">{restaurant.rating || 'N/A'}</span>
											{restaurant.review_count && (
												<span className="ml-2 text-gray-400 text-xs">{restaurant.review_count} reviews</span>
											)}
										</div>
										<div className="text-xs text-gray-500 mt-1 truncate">{restaurant.cuisine}</div>
										<div className="text-xs text-gray-500 truncate">{restaurant.address?.['addr:street'] || ''}</div>
									</div>
								</div>
								{/* Feature icons and distance */}
								<div className="flex items-center mt-2 text-xs text-gray-600 gap-2">
									{/* Example feature icons, add more as needed */}
									{restaurant.cuisine?.toLowerCase().includes('vegan') && <span title="Vegan">🥦</span>}
									{restaurant.cuisine?.toLowerCase().includes('vegetarian') && <span title="Vegetarian">��</span>}
									{/* Add more icons for features like outdoor seating, etc. */}
									<span className="ml-auto">{restaurant.distance ? `${restaurant.distance} mi` : ''}</span>
								</div>
								<div className="flex justify-between items-center mt-2">
									<SaveRestaurantButton restaurant={restaurant} />
									<Button size="sm" variant="outline">Details</Button>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
