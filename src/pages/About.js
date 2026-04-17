import React from 'react';

function About() {
  return (
    <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-pink-600">About Us</h1>
        <p className="text-lg mb-2 text-center">
          <span className="font-extrabold text-pink-600 text-2xl drop-shadow">Travelerly</span>
          <span className="ml-2">is your trusted platform for booking hotels with ease and confidence.</span>
        </p>
        <p className="text-gray-700 text-center">We aim to provide the best experience for travelers worldwide, with a focus on comfort, convenience, and reliability.</p>
      </div>
    </div>
  );
}

export default About;
