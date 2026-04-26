// Global helper for browser scripts// eslint-disable-next-line no-unused-varsconst fetchData = async (url, options = {}) => {
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
