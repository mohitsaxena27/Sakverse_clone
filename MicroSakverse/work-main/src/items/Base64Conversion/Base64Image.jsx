// Base64Image.jsx
import React from 'react';

const Base64Image = ({ base64Data, altText }) => {
  if (!base64Data) {
    return <p>No image available</p>;
  }

  const imageSrc = `data:image/png;base64,${base64Data}`;

  return <img src={imageSrc} alt={altText} style={{ width: '100%', height: 'auto' }} />;
};

export default Base64Image;
