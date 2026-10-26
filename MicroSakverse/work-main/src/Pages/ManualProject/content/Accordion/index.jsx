import React, { useRef, useEffect } from 'react';
import inprogress from '../../../../assets/icons/inprogress.svg';
import completed from '../../../../assets/icons/tick.svg';


const Accordion = ({ title, isOpen, toggle, icon, children, statusIcon }) => {
  const accordionRef = useRef(null); // Reference for scrolling

  const handleToggle = () => {
    // Check if content (children) is not available
    if (!children) {
      alert("Creation is in progress, please wait.");
      return; 
    }
  
    toggle(); 
  };

  return (
    <div
      ref={accordionRef} // Set the ref on the accordion div
      className="border border-gray-300 rounded-xl mb-4 shadow-md overflow-hidden transition-all duration-300 ease-in-out"
    >
      <div 
        onClick={handleToggle} // Use the custom handleToggle function
        className="flex justify-between items-center p-4 bg-white cursor-pointer hover:bg-gray-200 transition-colors duration-200"
      >
        <div className="flex items-center">
          <span className="mr-2">{icon}</span>
          <h4 className="font-semibold text-sm text-font">{title}</h4>
        </div>
        <span className="text-xl">
        {/* <div className='flex justify-right'>status</div> */}
          {isOpen ? '-' : '+'}</span>
      </div>
      {isOpen && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
};

export default Accordion;
