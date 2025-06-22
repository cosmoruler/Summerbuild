import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Filter } from "lucide-react";

const cuisineList = [
  { name: "Malaysian", count: 8 },
  { name: "Peranakan", count: 3 },
  { name: "Seafood", count: 44 },
  { name: "Shanghainese", count: 1 },
  { name: "Sichuan", count: 46 },
  { name: "Singaporean", count: 50 },
  { name: "Southeast Asian", count: 8 },
  { name: "Taiwanese", count: 4 },
  { name: "Thai", count: 3 },
  { name: "Themed", count: 1 },
  { name: "Vegan", count: 1 },
  { name: "Vegetarian", count: 8 },
  { name: "Western", count: 2 },
];

export default function RestaurantFinder() {
  const [view, setView] = useState("map");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [ratingRange, setRatingRange] = useState([1, 6]);
  const [priceRange, setPriceRange] = useState([1, 5]);
  const [bookable, setBookable] = useState(false);

  const toggleSelection = (item, list, setList) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex gap-2">
          <Button variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}>Map</Button>
          <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>List</Button>
        </div>
        <Input
          placeholder="Search restaurants..."
          className="w-full"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Cuisine</h3>
              {(showAllCuisines ? cuisineList : cuisineList.slice(0, 6)).map(c => (
                <div key={c.name} className="flex items-center mb-1">
                  <Checkbox
                    checked={selectedCuisines.includes(c.name)}
                    onCheckedChange={() =>
                      toggleSelection(c.name, selectedCuisines, setSelectedCuisines)
                    }
                  />
                  <label className="ml-2 text-sm">{c.name} ({c.count})</label>
                </div>
              ))}
              <Button
                variant="link"
                className="text-xs p-0 mt-1"
                onClick={() => setShowAllCuisines(!showAllCuisines)}
              >
                {showAllCuisines ? "Show less" : "Show more"}
              </Button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Review Score</h3>
              <Slider
                min={1}
                max={6}
                step={1}
                defaultValue={ratingRange}
                onValueChange={setRatingRange}
              />
              <p className="text-sm mt-1 text-muted-foreground">
                {ratingRange[0]} - {ratingRange[1]}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Restaurant Price</h3>
              <Slider
                min={1}
                max={5}
                step={1}
                defaultValue={priceRange}
                onValueChange={setPriceRange}
              />
              <div className="flex justify-between text-sm mt-1 text-muted-foreground">
                <span>$</span>
                <span>$$</span>
                <span>$$$</span>
                <span>$$$$</span>
                <span>$$$$$</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox checked={bookable} onCheckedChange={() => setBookable(!bookable)} />
              <label className="text-sm">Bookable online</label>
            </div>

            <Button className="w-full mt-2">Apply Filters</Button>
          </SheetContent>
        </Sheet>
      </div>

      {view === "list" ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 shadow-md rounded-xl">
              <h3 className="font-semibold text-lg">Restaurant {i + 1}</h3>
              <p className="text-sm text-muted-foreground">Sample description of the restaurant.</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-red-500 font-medium text-sm">from $15</span>
                <Button size="sm">Details</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Map view placeholder (add Mapbox or Google Maps here)
        </div>
      )}
    </div>
  );
}
