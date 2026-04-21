import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const savedUser = Cookies.get('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
    setLoading(false);
  }, [user, navigate]);

  return { user, loading };
};

export default useAuth;
