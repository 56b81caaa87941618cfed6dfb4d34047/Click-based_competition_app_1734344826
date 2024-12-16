import React from 'react';

const Hero: React.FC = () => {
  
  return (
    <div className="bg-black w-full h-full relative">
      <div className="absolute top-4 right-4">
        <img src={`https://raw.githubusercontent.com/56b81caaa87941618cfed6dfb4d34047/Click-based_competition_app_1734344826/${window.MI_PROJECT_GIT_REF || 'main'}/src/assets/images/389974a757ba43428bf44cb404b414a3.jpeg`} alt="Hero" className="w-16 h-16 rounded-full" />
      </div>
    </div>
  );
};

export { Hero as component }

