import React from 'react';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ title, description, icon, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200 text-center w-full group"
    >
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-4 text-white shadow-inner group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-snug">{description}</p>
    </button>
  );
};