'use strict';

const apiUrl = 'https://media2.edu.metropolia.fi/restaurant/api/v1';

// your code here
const taulukko = document.querySelector('#target');
const modal = document.querySelector('#modal');

// ── Auth modal ──────────────────────────────────────────
const modalAuth   = document.querySelector('#modal-auth');
const btnLogin    = document.querySelector('#btn-show-login');
const btnRegister = document.querySelector('#btn-show-register');
const tabLogin    = document.querySelector('#tab-login');
const tabRegister = document.querySelector('#tab-register');
const panelLogin  = document.querySelector('#panel-login');
const panelReg    = document.querySelector('#panel-register');

const switchTab = (toLogin) => {
  tabLogin.classList.toggle('auth-tab--active',  toLogin);
  tabRegister.classList.toggle('auth-tab--active', !toLogin);
  tabLogin.setAttribute('aria-selected', toLogin);
  tabRegister.setAttribute('aria-selected', !toLogin);
  panelLogin.classList.toggle('auth-panel--hidden',  !toLogin);
  panelReg.classList.toggle('auth-panel--hidden', toLogin);
};

btnLogin.addEventListener('click', () => {
  switchTab(true);
  modalAuth.showModal();
});
btnRegister.addEventListener('click', () => {
  switchTab(false);
  modalAuth.showModal();
});
tabLogin.addEventListener('click',    () => switchTab(true));
tabRegister.addEventListener('click', () => switchTab(false));

// Close auth modal when clicking X or backdrop
modalAuth.addEventListener('click', (e) => {
  if (e.target.matches('.close-modal--auth') || e.target === modalAuth) {
    modalAuth.close();
  }
});
// ────────────────────────────────────────────────────────

// Handle close clicks for dynamically rendered modal content.
modal.addEventListener('click', (event) => {
  if (event.target.matches('.close-modal')) {
    modal.close();
  }
});

const haeRavintolat = async () => {
  try {
    // eslint-disable-next-line no-undef
    return await fetchData(apiUrl + '/restaurants');
  } catch (error) {
    console.error(error);
  }
};

const haePaivanMenu = async (id, lang) => {
  try {
    // eslint-disable-next-line no-undef
    return await fetchData(apiUrl + `/restaurants/daily/${id}/${lang}`);
  } catch (error) {
    console.error(error);
  }
};

// eslint-disable-next-line no-unused-vars
const haeViikonMenu = async (id, lang) => {
  try {
    // eslint-disable-next-line no-undef
    return await fetchData(apiUrl + `/restaurants/weekly/${id}/${lang}`);
  } catch (error) {
    console.error(error);
  }
};


const teeMenuHTML = (courses) => {
  let html = '';
  for (const course of courses) {
    const {name, price, diets} = course;
    html += `
    <article class="course">
      <p><strong>${name || 'Ei ilmoitettu'}</strong></p>
      <p>Hinta: ${price || 'Ei ilmoitettu'}</p>
      <p>Allergeenit: ${diets.reduce((allergeenit, diet) => {
      let ikoni;
      switch (diet) {
        case 'G':  ikoni = '&#127806;&#128683;'; break;
        case 'A':  ikoni = '&#127828;'; break;
        default:   ikoni = '&#127786;'; break;
      }
      return allergeenit ? allergeenit + ' | ' + ikoni : ikoni;
    }, '')}</p>
    </article>
    `;
  }
  return html;
};


const restaurantRow = (restaurant) => {
  const {name, address, city, company} = restaurant;
  const tr = document.createElement('tr');
  // nimisolu
  const nameTd = document.createElement('td');
  nameTd.innerText = name;
  // osoitesolu
  const addressTd = document.createElement('td');
  addressTd.innerText = address;
  // kaupunkisolu
  const cityTd = document.createElement('td');
  cityTd.innerText = city;
  // firmasolu
  const firmaTd = document.createElement('td');
  firmaTd.innerText = company;
  // lisätään solut riviin
  tr.append(nameTd, addressTd, cityTd, firmaTd);
  return tr;
};

const restaurantModal = (restaurant, menu) => {
  const menuHTML = teeMenuHTML(menu?.courses || []);

  return `
    <button type="button" class="close-modal" aria-label="Sulje">X</button>
    <h3>${restaurant.name}</h3>
    ${menuHTML}
  `;
};


(async () => {
  const restaurants = await haeRavintolat();
  // restaurants aakkosjärjestykseen
  restaurants.sort((a, b) =>
    a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1
  );

  for (const restaurant of restaurants) {
    // rivi
    const tr = restaurantRow(restaurant);

    tr.addEventListener('click', async () => {

      for (const elem of document.querySelectorAll('.highlight')) {
        elem.classList.remove('highlight');
      }

      tr.classList.add('highlight');

      // tyhjennä modal
      modal.innerHTML = '';
      // avaa modal
      modal.showModal();

      const pMenu = await haePaivanMenu(restaurant._id, 'fi');

      const modalHTML = restaurantModal(restaurant, pMenu);

      modal.insertAdjacentHTML('beforeend', modalHTML);
    });

    taulukko.append(tr);
  }
})();
