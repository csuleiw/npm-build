import React, { memo } from 'react';
import { GridCellData } from '../types';

interface GridBoardProps {
  numbers: GridCellData[];
  nextExpected: number;
  onCellClick: (num: number) => void;
  isGameActive: boolean;
  lastWrongClick: number | null;
}

const GridBoard: React.FC<GridBoardProps> = ({ 
  numbers, 
  nextExpected, 
  onCellClick, 
  isGameActive,
  lastWrongClick
}) => {
  return (
    <div className="grid grid-cols-5 gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-[600px] mx-auto aspect-square">
      {numbers.map((cell) => {
        const isClicked = cell.value < nextExpected;
        const isWrong = lastWrongClick === cell.value;

        return (
          <button
            key={cell.id}
            onClick={() => onCellClick(cell.value)}
            disabled={!isGameActive || isClicked}
            className={`
              relative flex items-center justify-center 
              text-3xl sm:text-5xl md:text-6xl font-bold rounded-xl transition-all duration-150 select-none
              ${isClicked 
                ? 'bg-indigo-50 text-indigo-300 shadow-inner scale-95 cursor-default' 
                : 'bg-white text-gray-900 shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95 border-b-4 border-gray-200 active:border-b-0 active:translate-y-1'
              }
              ${isWrong ? 'animate-shake bg-red-100 text-red-600 border-red-300' : ''}
              ${!isGameActive && !isClicked ? 'cursor-default opacity-80' : 'cursor-pointer'}
            `}
            aria-label={`Number ${cell.value}`}
          >
            {cell.value}
          </button>
        );
      })}
    </div>
  );
};

export default memo(GridBoard);