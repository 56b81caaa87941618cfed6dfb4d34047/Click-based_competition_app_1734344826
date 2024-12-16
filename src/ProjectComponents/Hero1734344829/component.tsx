import React from 'react';

const Hero: React.FC = () => {
  
  return (
    <div className="bg-black py-16 text-white w-full h-full">
      <div className="container mx-auto px-4 flex flex-col items-center h-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Dominate the Battlefield with Every Click!</h1>
          <p className="text-xl mb-6">Engage in epic online battles where strategy meets speed. Can you outclick your opponents and rise to the top?</p>
        </div>
        <div className="flex justify-center">
          <img src={`https://raw.githubusercontent.com/56b81caaa87941618cfed6dfb4d34047/Click-based_competition_app_1734344826/${window.MI_PROJECT_GIT_REF || 'main'}/src/assets/images/389974a757ba43428bf44cb404b414a3.jpeg`} alt="Hero" className="max-w-full h-auto" />
        </div>
      </div>
    </div>
  );
};

export { Hero as component }