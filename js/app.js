"use strict";

const API_BASE = 'https://media2.edu.metropolia.fi/restaurant/api/v1';

const target = document.querySelector('#target');
const modal = document.querySelector('#modal');

const modalAuth = document.querySelector('#modal-auth');
const btnLogin = document.querySelector('#btn-show-login');

const tabLogin = document.querySelector('#tab-login');
const tabRegister = document.querySelector('#tab-register');
const panelLogin = document.querySelector('#panel-login');
const panelRegister = document.querySelector('#panel-register');


const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY)) || [];
const saveUsers = (users) =>
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
const getCurrentUser = () =>
  JSON.parse(localStorage.getItem(CURRENT_USER_KEY));


const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');


const switchTab = (toLogin) => {
  tabLogin?.classList.toggle('auth-tab--active', toLogin);
  tabRegister?.classList.toggle('auth-tab--active', !toLogin);

  panelLogin?.classList.toggle('auth-panel--hidden', !toLogin);
  panelRegister?.classList.toggle('auth-panel--hidden', toLogin);
};


const setupAuth = () => {
  const registerForm = panelRegister?.querySelector('form');
  const loginForm = panelLogin?.querySelector('form');


  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;

    const users = getUsers();

    if (users.find((u) => u.email === email)) {
      alert('User already exists');
      return;
    }

    users.push({ email, password });
    saveUsers(users);

    alert('Registered! You can now log in.');
    switchTab(true);
  });


  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    const users = getUsers();

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      alert('Wrong email or password');
      return;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    alert('Logged in!');
    modalAuth?.close();
    updateAuthUI();
  });
};

const updateAuthUI = () => {
  const user = getCurrentUser();

  if (!btnLogin) return;

  if (user) {
    btnLogin.textContent = `Logout (${user.email})`;

    btnLogin.onclick = () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      updateAuthUI();
    };
  } else {
    btnLogin.textContent = 'Login';

    btnLogin.onclick = () => {
      switchTab(true);
      modalAuth?.showModal();
    };
  }
};

const setupAuthModal = () => {
  btnLogin?.addEventListener('click', () => {
    if (!getCurrentUser()) {
      switchTab(true);
      modalAuth?.showModal();
    }
  });

  tabLogin?.addEventListener('click', () => switchTab(true));
  tabRegister?.addEventListener('click', () => switchTab(false));

  modalAuth?.addEventListener('click', (e) => {
    if (e.target === modalAuth || e.target.matches('.close-modal--auth')) {
      modalAuth.close();
    }
  });
};

const setupRestaurantModal = () => {
  modal?.addEventListener('click', (e) => {
    if (e.target === modal || e.target.matches('.close-modal')) {
      modal.close();
    }
  });
};


const apiGet = async (url) => {
  if (typeof fetchData !== 'function') {
    throw new Error('fetchData is not loaded');
  }
  return fetchData(url);
};

const getRestaurants = async () => {
  const data = await apiGet(`${API_BASE}/restaurants`);
  console.log('API response:', data);

  return data?.data || data?.results || data || [];
};

const getDailyMenu = async (id, lang = 'fi') => {
  return apiGet(`${API_BASE}/restaurants/daily/${id}/${lang}`);
};


const restaurantRow = (restaurant) => {
  const tr = document.createElement('tr');

  const nameTd = document.createElement('td');
  nameTd.textContent = restaurant?.name ?? '';

  const addressTd = document.createElement('td');
  addressTd.textContent = restaurant?.address ?? restaurant?.street_address ?? '';

  const cityTd = document.createElement('td');
  cityTd.textContent = restaurant?.city ?? restaurant?.municipality ?? '';

  const companyTd = document.createElement('td');
  companyTd.textContent = restaurant?.company ?? restaurant?.provider ?? '';

  tr.append(nameTd, addressTd, cityTd, companyTd);
  return tr;
};

const menuHtml = (menu) => {
  const courses = Array.isArray(menu?.courses) ? menu.courses : [];
  if (courses.length === 0) return '<p>Ei ruokalistaa saatavilla.</p>';

  return courses
    .map((course) => {
      const name = escapeHtml(course?.name || 'Ei ilmoitettu');
      const price = escapeHtml(course?.price || 'Ei ilmoitettu');
      return `<article class="course"><p><strong>${name}</strong></p><p>Hinta: ${price}</p></article>`;
    })
    .join('');
};

const restaurantModalHtml = (restaurant, menu) => `
 <button type="button" class="close-modal">X</button>
 <h3>${escapeHtml(restaurant?.name ?? 'Ravintola')}</h3>
 ${menuHtml(menu)}
`;


const init = async () => {
  setupAuthModal();
  setupRestaurantModal();
  setupAuth();
  updateAuthUI();

  if (!target || !modal) return;

  let restaurants = [];

  try {
    restaurants = await getRestaurants();
  } catch (error) {
    console.error(error);

    const container = target.tagName === 'TBODY' ? target : target.querySelector('tbody') || target;
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'Cannot connect to API.';
    tr.append(td);
    container.append(tr);
    loadingMsg.style.display = 'none';
    return;
  }

  restaurants.sort((a, b) =>
    (a?.name ?? '').localeCompare(b?.name ?? '', 'fi', { sensitivity: 'base' })
  );

  setupFilters(restaurants);
  displayRestaurants(restaurants);
  loadingMsg.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', init);

const filterCity = document.querySelector('#filter-city');
const filterCompany = document.querySelector('#filter-company');
const filterSearch = document.querySelector('#filter-search');
const loadingMsg = document.querySelector('#loading-msg');


const populateFilters = (restaurants) => {
  const cities = new Set();
  const companies = new Set();

  restaurants.forEach(r => {
    if (r.city || r.municipality) cities.add(r.city || r.municipality);
    if (r.company || r.provider) companies.add(r.company || r.provider);
  });

  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    filterCity.append(option);
  });

  companies.forEach(company => {
    const option = document.createElement('option');
    option.value = company;
    option.textContent = company;
    filterCompany.append(option);
  });
};

const filterRestaurants = (restaurants) => {
  const cityFilter = filterCity.value;
  const companyFilter = filterCompany.value;
  const searchFilter = filterSearch.value.toLowerCase();

  return restaurants.filter(r => {
    const city = (r.city || r.municipality || '').toLowerCase();
    const company = (r.company || r.provider || '').toLowerCase();
    const name = (r.name || '').toLowerCase();
    const address = (r.address || r.street_address || '').toLowerCase();

    return (!cityFilter || city === cityFilter.toLowerCase()) &&
           (!companyFilter || company === companyFilter.toLowerCase()) &&
           (!searchFilter || name.includes(searchFilter) || address.includes(searchFilter));
  });
};

const displayRestaurants = (restaurants) => {
  const container = target.tagName === 'TBODY' ? target : target.querySelector('tbody') || target;
  container.innerHTML = '';

  if (restaurants.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No restaurants match the filters.';
    tr.append(td);
    container.append(tr);
    return;
  }

  const frag = document.createDocumentFragment();

  for (const restaurant of restaurants) {
    const tr = restaurantRow(restaurant);

    tr.addEventListener('click', async () => {
      document.querySelectorAll('.highlight').forEach((el) =>
        el.classList.remove('highlight')
      );
      tr.classList.add('highlight');

      modal.innerHTML = '<p>Loading menu...</p>';
      modal.showModal();

      let menu = null;

      try {
        menu = await getDailyMenu(restaurant?.id || restaurant?._id, 'fi');
      } catch (error) {
        console.error(error);
      }

      modal.innerHTML = restaurantModalHtml(restaurant, menu);
    });

    frag.append(tr);
  }

  container.append(frag);
};

const setupFilters = (restaurants) => {
  populateFilters(restaurants);

  const applyFilters = () => {
    const filtered = filterRestaurants(restaurants);
    displayRestaurants(filtered);
  };

  filterCity.addEventListener('change', applyFilters);
  filterCompany.addEventListener('change', applyFilters);
  filterSearch.addEventListener('input', applyFilters);
};
