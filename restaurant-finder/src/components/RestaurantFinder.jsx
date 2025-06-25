import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
//import { Card } from "@/components/ui/card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import { Filter, Menu, Search, X } from "lucide-react";
import useRecommendations from "../hooks/useRecommendations"; // Import the custom hook
import RestaurantMap from './RestaurantMap';
import ChoiceChipGroup from "@/components/ui/choicechips";
import UserProfile from './UserProfile';
import SaveRestaurantButton from './SaveRestaurantButton';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
	const { user } = useAuth();
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
	const [isAdmin, setIsAdmin] = useState(false);

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

	useEffect(() => {
		const fetchProfile = async () => {
			// Fetch the user's profile from Supabase
			const { data, error } = await supabase
				.from('profiles')
				.select('is_admin')
				.eq('id', user.id)
				.single();
			if (data && data.is_admin) setIsAdmin(true);
			else setIsAdmin(false);
		};
		if (user) fetchProfile();
	}, [user]);

	return (
		<div className="min-h-screen flex flex-col max-w-7xl mx-auto p-2 sm:p-4 w-full">
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
					<Card key={restaurant.name + i} className="p-4 shadow-md rounded-xl w-full">
						<CardHeader className="flex items-center gap-4">
						<img
							src={restaurant.image || '/placeholder.jpg'}
							alt={restaurant.name}
							className="w-16 h-16 rounded-lg object-cover bg-gray-100"
						/>
						<div className="flex-1">
							<CardTitle className="truncate text-lg">{restaurant.name}</CardTitle>
							<CardDescription className="text-xs">{restaurant.cuisine || "Cuisine not specified"}</CardDescription>
						</div>
						</CardHeader>

						<CardContent className="text-sm text-gray-700 space-y-1">
						<div>
							<span className="font-semibold">Rating:</span>{" "}
							{restaurant.rating ? (
							<span>{restaurant.rating}</span>
							) : (
							<span className="italic text-gray-400">Not specified</span>
							)}
						</div>

						<div>
							<span className="font-semibold">Reviews:</span>{" "}
							{restaurant.review_count ? (
							<span>{restaurant.review_count}</span>
							) : (
							<span className="italic text-gray-400">No reviews</span>
							)}
						</div>

						<div>
							<span className="font-semibold">Price:</span>{" "}
							{restaurant.price_level || <span className="italic text-gray-400">Not specified</span>}
						</div>

						<div className="break-words overflow-hidden text-ellipsis">
							<span className="font-semibold">Address:</span>{" "}
							{restaurant.address?.['addr:street'] || (
								<span className="italic text-gray-400">Not specified</span>
							)}
						</div>


						{restaurant.opening_hours && (
							<div>
							<span className="font-semibold">Hours:</span> {restaurant.opening_hours}
							</div>
						)}
						</CardContent>

						<CardFooter className="flex flex-wrap gap-1 text-xs">
						{restaurant.website && (
							<a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
							Website
							</a>
						)}
						{restaurant.phone && <span className="text-gray-600">{restaurant.phone}</span>}
						{restaurant.amenities?.map((tag, index) => (
							<span key={index} className="bg-gray-100 px-2 py-0.5 rounded-full">
							{tag.replace(/_/g, ' ')}
							</span>
						))}
						</CardFooter>
					</Card>
					))}
             </div>   
           )}       
           </div>   

			{/* Filter Overlay Portal */}
			{showFilters && createPortal(
				<div className="fixed inset-0 z-[9999] flex justify-center items-start md:items-center">
					{/* Overlay background */}
					<div
						className="absolute inset-0 bg-black bg-opacity-40"
						onClick={() => setShowFilters(false)}
					/>
					{/* Filter panel */}
					<div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-xs md:max-w-md mt-20 md:mt-0 overflow-y-auto max-h-[90vh] z-10">
						<button
							className="absolute top-2 right-2 text-xl"
							onClick={() => setShowFilters(false)}
						>
							&times;
						</button>
						{/* Amenity Type */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Amenity Type</h3>
							{amenityTypes.map(type => (
								<div key={type} className="flex items-center mb-1">
									<Checkbox
										checked={selectedFilters.includes(type)}
										onCheckedChange={() => toggleFilter(type)}
										id={`amenity-${type}`}
									/>
									<label className="ml-2 text-sm" htmlFor={`amenity-${type}`}>{type}</label>
								</div>
							))}
						</div>
						{/* Cuisine with Show more/less */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Cuisine</h3>
							{(showAllCuisines ? cuisineList : cuisineList.slice(0, 6)).map(cuisine => (
								<div key={cuisine} className="flex items-center mb-1">
									<Checkbox
										checked={selectedFilters.includes(cuisine)}
										onCheckedChange={() => toggleFilter(cuisine)}
										id={`cuisine-${cuisine}`}
									/>
									<label
										className={`ml-2 text-sm ${selectedFilters.includes(cuisine) ? "text-orange-500" : ""}`}
										htmlFor={`cuisine-${cuisine}`}
									>
										{cuisine} ({cuisineCounts[cuisine] || 0})
									</label>
								</div>
							))}
							<button
								className="text-xs font-semibold text-blue-600 mt-1 flex items-center"
								onClick={() => setShowAllCuisines(v => !v)}
							>
								{showAllCuisines ? (
									<span className="mr-1">-</span>
								) : (
									<span className="mr-1">+</span>
								)}
								{showAllCuisines ? "Show less" : "Show more"}
							</button>
						</div>
						{/* Dietary/Options */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Dietary/Options</h3>
							{dietaryOptions.map(opt => (
								<div key={opt} className="flex items-center mb-1">
									<Checkbox
										checked={selectedFilters.includes(opt)}
										onCheckedChange={() => toggleFilter(opt)}
										id={`dietary-${opt}`}
									/>
									<label className="ml-2 text-sm" htmlFor={`dietary-${opt}`}>{opt}</label>
								</div>
							))}
						</div>
						{/* Seating/Features */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Seating/Features</h3>
							{seatingFeatures.map(feat => (
								<div key={feat} className="flex items-center mb-1">
									<Checkbox
										checked={selectedFilters.includes(feat)}
										onCheckedChange={() => toggleFilter(feat)}
										id={`seating-${feat}`}
									/>
									<label className="ml-2 text-sm" htmlFor={`seating-${feat}`}>{feat}</label>
								</div>
							))}
						</div>
						{/* Payment */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Payment</h3>
							{paymentOptions.map(pay => (
								<div key={pay} className="flex items-center mb-1">
									<Checkbox
										checked={selectedFilters.includes(pay)}
										onCheckedChange={() => toggleFilter(pay)}
										id={`payment-${pay}`}
									/>
									<label className="ml-2 text-sm" htmlFor={`payment-${pay}`}>{pay}</label>
								</div>
							))}
						</div>
						{/* Accessibility */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Accessibility</h3>
							{accessibilityOptions.map(acc => (
								<div key={acc} className="flex items-center mb-1">
									<Checkbox
										checked={selectedFilters.includes(acc)}
										onCheckedChange={() => toggleFilter(acc)}
										id={`accessibility-${acc}`}
									/>
									<label className="ml-2 text-sm" htmlFor={`accessibility-${acc}`}>{acc}</label>
								</div>
							))}
						</div>
						{/* Price Level (slider) */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Restaurant Price</h3>
							<Slider
								min={1}
								max={5}
								step={1}
								value={priceRange}
								onValueChange={setPriceRange}
							/>
							<div className="flex justify-between text-xs mt-1">
								<span>$</span>
								<span>$$</span>
								<span>$$$</span>
								<span>$$$$</span>
								<span>$$$$$</span>
							</div>
						</div>
						{/* Review Score (slider) */}
						<div className="mb-6">
							<h3 className="font-medium mb-2">Review score</h3>
							<Slider
								min={1}
								max={6}
								step={1}
								value={ratingRange}
								onValueChange={setRatingRange}
							/>
							<div className="flex justify-between text-xs mt-1">
								{[1, 2, 3, 4, 5, 6].map((n) => (
									<span key={n}>{n}</span>
								))}
							</div>
						</div>
						<ChoiceChipGroup
							label="Price Level"
							options={["$", "$$", "$$$", "$$$$", "$$$$$"]}
							selected={priceValue}
							onChange={setPriceValue}
						/>
						<ChoiceChipGroup
							label="Review Score"
							options={[1, 2, 3, 4, 5, 6]}
							selected={reviewScore}
							onChange={setReviewScore}
						/>
						{/* Bookable Toggle */}
						<div className="flex items-center mb-4">
							<Switch
								checked={bookable}
								onCheckedChange={setBookable}
								id="bookable"
							/>
							<label className="ml-2 text-sm font-medium">Bookable online</label>
						</div>
						{/* Others */}
						<div className="mb-4">
							<h3 className="font-medium mb-2">Others</h3>
							{otherOptions.map(opt => (
								<div key={opt} className="flex items-center mb-1">
									<Checkbox
										checked={selectedFilters.includes(opt)}
										onCheckedChange={() => toggleFilter(opt)}
										id={`other-${opt}`}
									/>
									<label className="ml-2 text-sm" htmlFor={`other-${opt}`}>{opt}</label>
								</div>
							))}
						</div>
						{isAdmin && (
							<Link
								to="/admin"
								className="w-full flex items-center space-x-3 px-4 py-2 text-left text-blue-700 hover:bg-blue-50 transition-colors duration-150"
							>
								<User className="h-4 w-4" />
								<span>Manage Users</span>
							</Link>
						)}
					</div>
				</div>,
				document.body
			)}
		</div>
	);
}
