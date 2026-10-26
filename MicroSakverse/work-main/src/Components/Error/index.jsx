// ErrorPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import wrong from '../../assets/icons/eror.svg';

const ErrorPage = ({ error, id }) => {
  const navigate = useNavigate();

  const handleCheck = () => {
    if (id === 1 || (error && error.status === 401)) {
      navigate('/'); // Redirect to login for unauthorized error
    } else {
      navigate(-1); // Refresh the page
    }
  };
 
  return (
    <div className="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-white z-50">
      <img src={wrong} alt="Error" className="w-40 mb-4" />
      <div className="text-sm text-center mb-4 m-10">
        <h1 className="font-bold text-5xl text-red-600 leading-normal">
          SOMETHING WENT WRONG.
        </h1>
        <br />
        <h1 className="font-bold text-xl text-blue-700">
          {error ? error.message : 'An error occurred.'}
        </h1>
      </div>
      <div className="flex">
        <button className="bg-blue-500 p-2 rounded-full text-white mr-4" onClick={handleCheck}>
          CLICK HERE
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
