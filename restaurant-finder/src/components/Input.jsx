import React from 'react'

const Input = React.forwardRef(({ label, type = 'text', placeholder, value, onChange, ...props }, ref) => {
  return (
    <div className="flex flex-col mb-4">
      {label && (
        <label className="mb-1 text-sm font-medium text-gray-700" htmlFor={props.id}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
    </div>
  )
})

export default Input
