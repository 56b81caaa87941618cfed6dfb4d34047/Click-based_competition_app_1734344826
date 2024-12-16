import React from 'react';

const Hero: React.FC = () => {
  
  return (
    <div className="bg-black py-16 text-white w-full h-full">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center h-full">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl font-bold mb-4">Dominate the Battlefield with Every Click!</h1>
          <p className="text-xl mb-6">Engage in epic online battles where strategy meets speed. Can you outclick your opponents and rise to the top?</p>
        </div>
      </div>
    </div>
  );
};

export { Hero as component }