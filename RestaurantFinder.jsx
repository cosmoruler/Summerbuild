import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
//import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Filter, Menu, Search } from "lucide-react";
import useRecommendations from "../hooks/useRecommendations"; // Import the custom hook
import RestaurantMap from './RestaurantMap';
//import * as Slider from "@radix-ui/react-slider";
import NumberToggle from "@/components/ui/togglebutton";
import ButtonGroupSelector from "@/components/ui/sliderbutton"
import ChoiceChipGroup from "@/components/ui/choicechips";
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
	const [view, setView] = useState("map");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFilters, setSelectedFilters] = useState([]); // All filter labels
	const [showAllCuisines, setShowAllCuisines] = useState(false);
	const [ratingRange, setRatingRange] = useState([1, 6]);
	const [priceRange, setPriceRange] = useState([1, 5]);
	const [bookable, setBookable] = useState(false);
	const [showFilters, setShowFilters] = useState(false); // For mobile filter overlay
	const [priceValue, setPriceValue] = useState("$");
    const [reviewScore, setReviewScore] = useState(1);
	const { user } = useAuth();

	const { results, loading, error } = useRecommendations(
		userLocation,
		searchTerm,
		priceRange,
		ratingRange,
		bookable
	);

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

	return (
		<div className="max-w-7xl mx-auto p-2 sm:p-4 w-full">
			{/* Top Search Bar with Menu and Search Icons */}
			<div className="w-full max-w-2xl mx-auto mt-4 mb-2">
				<div className="flex items-center bg-white rounded-2xl shadow px-4 py-2 w-full">
					{/* Menu Icon */}
					<button className="text-red-500 mr-2">
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

			{/* Responsive layout: side-by-side on desktop, overlay on mobile */}
			<div className="flex flex-col md:flex-row w-full h-[80vh] gap-4">
				{/* Desktop Filter Panel */}
				<div className="hidden md:block w-80 max-w-xs bg-white rounded-lg shadow-md p-4 overflow-y-auto h-full">
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
						{visibleCuisines.map(c => (
							<div key={c} className="flex items-center mb-1">
								<Checkbox
									checked={selectedFilters.includes(c)}
									onCheckedChange={() => toggleFilter(c)}
									id={`cuisine-${c}`}
								/>
								<label className="ml-2 text-sm" htmlFor={`cuisine-${c}`}>{c}</label>
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
	{/* <NumberToggle
  label="Price Level"
  value={priceRange}
  setValue={setPriceRange}
  min={1}
  max={5}
  type="price"
/>

<NumberToggle
  label="Review Score"
  value={ratingRange}
  setValue={setRatingRange}
  min={1}
  max={5}
  type="number"
/> */}

{/* <ButtonGroupSelector
  value={priceValue}
  onChange={setPriceValue}
  labels={["$", "$$", "$$$", "$$$$", "$$$$$"]}
/>

<ButtonGroupSelector
  value={reviewScore}
  onChange={setReviewScore}
  labels={[1, 2, 3, 4, 5]}
/> */}

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
				</div>
				{/* Mobile Filter Overlay */}
				{showFilters && (
					<div className="fixed inset-0 bg-black bg-opacity-40 z-30 flex justify-center items-start">
						<div className="bg-white rounded-lg shadow-md p-4 w-full max-w-xs mt-8 overflow-y-auto h-[80vh] relative">
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
											id={`amenity-mobile-${type}`}
										/>
										<label className="ml-2 text-sm" htmlFor={`amenity-mobile-${type}`}>{type}</label>
									</div>
								))}
							</div>
							{/* Cuisine with Show more/less */}
							<div className="mb-6">
								<h3 className="font-medium mb-2">Cuisine</h3>
								{visibleCuisines.map(c => (
									<div key={c} className="flex items-center mb-1">
										<Checkbox
											checked={selectedFilters.includes(c)}
											onCheckedChange={() => toggleFilter(c)}
											id={`cuisine-mobile-${c}`}
										/>
										<label className="ml-2 text-sm" htmlFor={`cuisine-mobile-${c}`}>{c}</label>
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
											id={`dietary-mobile-${opt}`}
										/>
										<label className="ml-2 text-sm" htmlFor={`dietary-mobile-${opt}`}>{opt}</label>
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
											id={`seating-mobile-${feat}`}
										/>
										<label className="ml-2 text-sm" htmlFor={`seating-mobile-${feat}`}>{feat}</label>
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
											id={`payment-mobile-${pay}`}
										/>
										<label className="ml-2 text-sm" htmlFor={`payment-mobile-${pay}`}>{pay}</label>
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
											id={`accessibility-mobile-${acc}`}
										/>
										<label className="ml-2 text-sm" htmlFor={`accessibility-mobile-${acc}`}>{acc}</label>
									</div>
								))}
							</div>
							{/* Price Level (slider) */}
	{/* <NumberToggle
  label="Price Level"
  value={priceRange}
  setValue={setPriceRange}
  min={1}
  max={5}
  type="price"
/>

<NumberToggle
  label="Review Score"
  value={ratingRange}
  setValue={setRatingRange}
  min={1}
  max={5}
  type="number"
/> */}


{/* <ButtonGroupSelector
  value={priceValue}
  onChange={setPriceValue}
  labels={["$", "$$", "$$$", "$$$$", "$$$$$"]}
/>

<ButtonGroupSelector
  value={reviewScore}
  onChange={setReviewScore}
  labels={[1, 2, 3, 4, 5]}
/> */}

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



						
</div>
							{/* Bookable Toggle */}
							<div className="flex items-center mb-4">
								<Switch
									checked={bookable}
									onCheckedChange={setBookable}
									id="bookable-mobile"
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
											id={`other-mobile-${opt}`}
										/>
										<label className="ml-2 text-sm" htmlFor={`other-mobile-${opt}`}>{opt}</label>
									</div>
								))}
							</div>
						</div>
					
				)}
				{/* Main Content (Map/List) */}
				<div className="flex-1 h-full relative">
					{view === "map" ? (
						<RestaurantMap restaurants={results} userLocation={userLocation} />
					) : (
						<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
							{loading && <p>Loading...</p>}
							{error && <p className="text-red-500">{error}</p>}
							{results.map((restaurant, i) => (
								<Card key={restaurant.name + i} className="p-4 shadow-md rounded-xl w-full">
									<h3 className="font-semibold text-lg">{restaurant.name}</h3>
									<p className="text-sm text-muted-foreground">
										{restaurant.cuisine} | {restaurant.address?.['addr:street'] || ""}
									</p>
									<div className="flex justify-between items-center mt-3">
										<Button size="sm">Details</Button>
									</div>
								</Card>
							))}
							{!loading && results.length === 0 && <p>No results found.</p>}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
