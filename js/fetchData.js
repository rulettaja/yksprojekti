const fetchData = async (url, options = {}) => {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    throw new Error('Network error');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
};
