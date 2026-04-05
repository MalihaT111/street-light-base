import { useState, useEffect } from 'react';

const useFetch = (url, options) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsString = JSON.stringify(options);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, options);
        const json = await response.json();

        if (!response.ok || (json && json.success === false)) {
          throw new Error(json.error || json.msg || `HTTP error! status: ${response.status}`);
        }

        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, optionsString]);

  return { data, loading, error };
};

export default useFetch;
