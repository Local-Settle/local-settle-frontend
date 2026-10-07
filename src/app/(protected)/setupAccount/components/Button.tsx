'use client';

import { ButtonProps } from "../utils/ButtonProps";

export function Button({ text, disabled }: ButtonProps) {
    return (
        <button 
            type="submit" 
            disabled={disabled}
            className={`uppercase w-150 h-17 rounded-xl text-[18px] font-black transition-all ${
                disabled 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-[#55D6BE] text-[#081521] hover:bg-[#55D6BE]'
            }`}
        >
            {text}
        </button>
    );
}