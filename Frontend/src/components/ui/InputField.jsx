import React, { forwardRef } from 'react';

const InputField = forwardRef(({
    label,
    type = 'text',
    required,
    disabled,
    error,
    ...rest
}, ref) => (
    <div className="w-full">
        {label && (
            <label className="block text-sm font-bold text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}

        <input
            ref={ref}
            type={type}
            required={required}
            disabled={disabled}
            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed ${
                error
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20'
            }`}
            {...rest}
        />
        {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
));

InputField.displayName = 'InputField';

export default InputField;
