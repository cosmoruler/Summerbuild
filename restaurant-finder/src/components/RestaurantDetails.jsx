import React from "react";
import { Card } from "@/components/ui/card";

export default function RestaurantDetails({ restaurant, onClose }) {
  if (!restaurant) return null;
  const { name, cuisine, address, price_level, rating, type } = restaurant;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-xl text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close details"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">{name}</h2>
        <p className="mb-2 text-gray-600">{cuisine}</p>
        {address && (
          <div className="mb-2 text-sm text-gray-500">
            {address["addr:housenumber"] && (
              <span>{address["addr:housenumber"]} </span>
            )}
            {address["addr:street"] && <span>{address["addr:street"]}, </span>}
            {address["addr:city"] && <span>{address["addr:city"]}</span>}
            {address["addr:postcode"] && (
              <span>, {address["addr:postcode"]}</span>
            )}
          </div>
        )}
        {price_level && (
          <div className="mb-1">
            Price:{" "}
            <span className="font-semibold">{price_level}</span>
          </div>
        )}
        {rating && (
          <div className="mb-1">
            Rating:{" "}
            <span className="font-semibold text-yellow-600">{rating}</span>
          </div>
        )}
        {type && (
          <div className="mt-2">
            <h4 className="font-semibold mb-1">Features:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {Object.entries(type).map(([key, value]) => (
                <li key={key}>
                  <span className="font-medium">{key}:</span> {value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
