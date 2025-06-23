import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Filter } from "lucide-react";
import useUserLocation from "../useUserLocation"; // adjust path if needed
import useRecommendations from "../hooks/useRecommendations"; // Import the custom hook
import RestaurantMap from './RestaurantMap';

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

export default function RestaurantFinder() {
	const [view, setView] = useState("map");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFilters, setSelectedFilters] = useState([]); // All filter labels
	const userLocation = useUserLocation();
	const { results, loading, error } = useRecommendations(userLocation, searchTerm);

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

	return (
		<div className="max-w-5xl mx-auto p-2 sm:p-4 w-full">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-4 w-full">
				<div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
					<Button
						variant={view === "map" ? "default" : "outline"}
						onClick={() => setView("map")}
						className="flex-1 sm:flex-none"
					>
						Map
					</Button>
					<Button
						variant={view === "list" ? "default" : "outline"}
						onClick={() => setView("list")}
						className="flex-1 sm:flex-none"
					>
						List
					</Button>
				</div>
				<Input
					placeholder="Search restaurants..."
					className="w-full sm:w-auto"
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
				/>
			</div>

			{/* Filter controls: Amenity Type */}
			<div className="flex flex-wrap gap-2 mb-2">
				{amenityTypes.map(type => (
					<Checkbox
						key={type}
						checked={selectedFilters.includes(type)}
						onCheckedChange={() => toggleFilter(type)}
						id={`amenity-${type}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Amenity Type</span>
			</div>
			{/* Cuisine */}
			<div className="flex flex-wrap gap-2 mb-2">
				{cuisineList.map(cuisine => (
					<Checkbox
						key={cuisine}
						checked={selectedFilters.includes(cuisine)}
						onCheckedChange={() => toggleFilter(cuisine)}
						id={`cuisine-${cuisine}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Cuisine</span>
			</div>
			{/* Dietary/Options */}
			<div className="flex flex-wrap gap-2 mb-2">
				{dietaryOptions.map(opt => (
					<Checkbox
						key={opt}
						checked={selectedFilters.includes(opt)}
						onCheckedChange={() => toggleFilter(opt)}
						id={`dietary-${opt}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Dietary/Options</span>
			</div>
			{/* Seating/Features */}
			<div className="flex flex-wrap gap-2 mb-2">
				{seatingFeatures.map(feat => (
					<Checkbox
						key={feat}
						checked={selectedFilters.includes(feat)}
						onCheckedChange={() => toggleFilter(feat)}
						id={`seating-${feat}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Seating/Features</span>
			</div>
			{/* Payment */}
			<div className="flex flex-wrap gap-2 mb-2">
				{paymentOptions.map(pay => (
					<Checkbox
						key={pay}
						checked={selectedFilters.includes(pay)}
						onCheckedChange={() => toggleFilter(pay)}
						id={`payment-${pay}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Payment</span>
			</div>
			{/* Accessibility */}
			<div className="flex flex-wrap gap-2 mb-2">
				{accessibilityOptions.map(acc => (
					<Checkbox
						key={acc}
						checked={selectedFilters.includes(acc)}
						onCheckedChange={() => toggleFilter(acc)}
						id={`accessibility-${acc}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Accessibility</span>
			</div>
			{/* Price Level */}
			<div className="flex flex-wrap gap-2 mb-2">
				{priceLevels.map(price => (
					<Checkbox
						key={price}
						checked={selectedFilters.includes(price)}
						onCheckedChange={() => toggleFilter(price)}
						id={`price-${price}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Price Level</span>
			</div>
			{/* Others */}
			<div className="flex flex-wrap gap-2 mb-4">
				{otherOptions.map(opt => (
					<Checkbox
						key={opt}
						checked={selectedFilters.includes(opt)}
						onCheckedChange={() => toggleFilter(opt)}
						id={`other-${opt}`}
					/>
				))}
				<span className="text-xs text-gray-500 ml-2">Others</span>
			</div>

			{view === "map" ? (
				<div className="w-full mb-4">
					<RestaurantMap restaurants={results} userLocation={userLocation} />
				</div>
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
	);
}
