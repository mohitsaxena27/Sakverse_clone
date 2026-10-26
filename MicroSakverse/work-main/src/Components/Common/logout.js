import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../Hooks/Auth/AuthContext'; // Importing AuthContext

const useLogout = () => {
  const navigate = useNavigate();
  const { logout } = useAuthContext(); // Use the logout method from context

  const handleLogout = async () => {
    try {
      await logout(); // Call logout to clear session and user data
      localStorage.clear();
      navigate('/login'); // Redirect to login page after logout
      
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return handleLogout; // Return the logout function
};

export default useLogout;
