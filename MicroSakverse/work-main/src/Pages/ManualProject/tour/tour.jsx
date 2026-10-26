import React, { useState } from 'react';

// Importing images from the slides folder
import slide1 from "../../../assets/images/slides/1.png";
import slide2 from "../../../assets/images/slides/2.png";
import slide3 from "../../../assets/images/slides/3.png";
import slide4 from "../../../assets/images/slides/4.png";
import slide5 from "../../../assets/images/slides/5.png";
import slide6 from "../../../assets/images/slides/6.png";
import slide7 from "../../../assets/images/slides/7.png";
import slide8 from "../../../assets/images/slides/8.png";
import slide9 from "../../../assets/images/slides/9.png";
import slide10 from "../../../assets/images/slides/10.png";

const Tour = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { type: 'image', content: slide1 },
    { type: 'image', content: slide2 },
    { type: 'image', content: slide3 },
    { type: 'image', content: slide4 },
    { type: 'image', content: slide5 },
    { type: 'image', content: slide6 },
    { type: 'image', content: slide7 },
    { type: 'image', content: slide8 },
    { type: 'image', content: slide9 },
    { type: 'image', content: slide10 },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete(); // Notify parent that the tour is complete
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1); // Move to the previous slide
    }
  };

  const handleSkip = () => {
    onComplete(); // Notify parent that the tour is complete
  };

  const renderContent = () => {
    const slide = slides[currentSlide];
    if (slide.type === 'image') {
      return (
        <div className="text-center">
          <img src={slide.content} alt={`slide-${currentSlide + 1}`} className="w-full h-auto rounded-lg" />
          <p className="mt-4 text-sm">{slide.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gray-500 p-6 rounded-lg shadow-xl max-w-4xl w-full transform transition-transform duration-500">
        <div>
          {renderContent()}
        </div>
        <div className="flex justify-between mt-6">
          {/* Show Skip button */}
          <button
            onClick={handleSkip}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Skip Tour
          </button>
          {currentSlide > 0 && (
            <button
              onClick={handleBack}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Back
            </button>
          )}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={handleNext}
              className="bg-green-500 text-font px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Next
            </button>
          )}
        </div>
        {currentSlide === slides.length - 1 && (
          <div className="mt-6 text-center">
            <p className="text-xl font-semibold">Get started with your journey!</p>
            <button
              onClick={handleNext}
              className="bg-green-500 text-white px-6 py-3 mt-4 rounded-lg hover:bg-green-700 transition"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tour;
