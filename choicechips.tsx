import React from "react";

type ChoiceChipGroupProps = {
  label?: string; //labels the options
  options: (string | number)[]; //shows the options available such as $ to $$$, etc
  selected: string | number; //vairable to store what was selected
  onChange: (value: string | number) => void; //callback when user selects a chip. 
};

export default function ChoiceChipGroup({
  label,
  options,
  selected,
  onChange
}: ChoiceChipGroupProps) {
  return (
    <div className="mb-4">
      {label && <h3 className="font-medium mb-2">{label}</h3>}
      {/*HTML to leave a small gap between the chips*/ }
      <div className="flex gap-2 flex-wrap"> 

        {/*STatement for each iteration of the buttons*/ }
        {options.map((opt, i) => (

          <button
            key={i}
            onClick={() => onChange(opt)}
            className={`px-4 py-1 rounded-full text-sm border 
              ${selected === opt 
               ?"bg-red-500 border-red-700 text-white" 
                //?  "bg-indigo-950 border-purple-600 text-white"
                : "bg-gray-100 border-gray-300 text-gray-600"}
              transition duration-150`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
