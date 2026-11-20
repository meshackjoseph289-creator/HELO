const defaultHostels = [
  { id: 1, name: 'Sunrise Hostel', location: 'Milimani, 1km from campus', price: 3500, image: '🏠' },
  { id: 2, name: 'Greenview Residence', location: 'Along Nairobi-Bungoma Road', price: 4500, image: '🏡' },
  { id: 3, name: 'Campus Comfort', location: 'Main Gate, opposite campus', price: 6000, image: '🏢' },
  { id: 4, name: 'Kibabii Heights', location: 'Kibabii Shopping Centre', price: 5500, image: '🏬' },
  { id: 5, name: 'Unity Apartments', location: 'West of Kibabii University', price: 7000, image: '🏘️' },
  { id: 6, name: 'Student Haven', location: 'Near Kibabii secondary', price: 4000, image: '🏚️' }
];

const getData = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};
const setData = (key, value) => localStorage.setItem(key, JSON.stringify(value));

let hostels = getData('kibabiiHostels', defaultHostels);
let users = getData('kibabiiUsers', []);
let adminPassword = localStorage.getItem('kibabiiAdminPassword') || 'admin123';
let messages = getData('kibabiiMessages', []);

function isImage(value) {
  return /^https?:\/\//i.test(value) || /^data:image/i.test(value);
}

function renderHostels(list = hostels) {
  const grid = document.getElementById('hostelGrid');
  document.getElementById('noResults').style.display = list.length ? 'none' : 'block';
  grid.innerHTML = list.map(hostel => `
    <article class="hostel-card reveal visible">
      <div class="hostel-photo">${isImage(hostel.image) ? `<img src="${hostel.image}" alt="${hostel.name}">` : (hostel.image || '🏠')}</div>
      <div class="hostel-info">
        <h3>${escapeHtml(hostel.name)}</h3>
        <div class="hostel-location">📍 ${escapeHtml(hostel.location)}</div>
        <div class="hostel-bottom">
          <div class="hostel-price"><strong>KSh ${Number(hostel.price).toLocaleString()}</strong><span>per month</span></div>
          <button class="contact-hostel" data-hostel="${escapeHtml(hostel.name)}">Enquire</button>
        </div>
      </div>
    </article>`).join('');
  document.getElementById('hostelCount').textContent = `${list.length}+`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}

function showToast(message, success = true) {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = message;
  document.getElementById('toastIcon').textContent = success ? '✓' : '!';
  toast.style.borderLeftColor = success ? '#22a06b' : '#dc3545';
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
function toggleSidebar(open) {
  sidebar.classList.toggle('open', open);
  overlay.classList.toggle('open', open);
}
document.getElementById('menuButton').addEventListener('click', () => toggleSidebar(true));
document.getElementById('closeSidebar').addEventListener('click', () => toggleSidebar(false));
overlay.addEventListener('click', () => toggleSidebar(false));

function filterHostels() {
  const query = document.getElementById('hostelSearch').value.trim().toLowerCase();
  const price = document.getElementById('priceFilter').value;
  const filtered = hostels.filter(hostel => {
    const matchesText = `${hostel.name} ${hostel.location}`.toLowerCase().includes(query);
    let matchesPrice = true;
    if (price === 'under4000') matchesPrice = Number(hostel.price) < 4000;
    if (price === '4000to6000') matchesPrice = Number(hostel.price) >= 4000 && Number(hostel.price) <= 6000;
    if (price === 'over6000') matchesPrice = Number(hostel.price) > 6000;
    return matchesText && matchesPrice;
  });
  renderHostels(filtered);
}
document.getElementById('hostelSearch').addEventListener('input', filterHostels);
document.getElementById('priceFilter').addEventListener('change', filterHostels);

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.auth === 'register' ? 'registerForm' : 'loginForm').classList.add('active');
  });
});

document.getElementById('registerForm').addEventListener('submit', event => {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const phone = document.getElementById('registerPhone').value.trim();
  const password = document.getElementById('registerPassword').value;
  if (users.some(user => user.email === email)) return showToast('This email is already registered.', false);
  users.push({ id: Date.now(), username, email, phone, password });
  setData('kibabiiUsers', users);
  event.target.reset();
  showToast('Registration successful! Welcome to Kibabii Rentals.');
  renderAdminUsers();
});

document.getElementById('loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const user = users.find(item => item.email === email && item.password === password);
  if (!user) return showToast('Invalid email or password.', false);
  event.target.reset();
  showToast(`Welcome back, ${user.username}!`);
});

const adminModal = document.getElementById('adminModal');
function openAdmin() {
  toggleSidebar(false);
  adminModal.classList.add('open');
}
function closeAdmin() { adminModal.classList.remove('open'); }
document.getElementById('openAdminButton').addEventListener('click', openAdmin);
document.getElementById('sideAdminButton').addEventListener('click', openAdmin);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeAdmin()));
adminModal.addEventListener('click', event => { if (event.target === adminModal) closeAdmin(); });

document.getElementById('adminLoginForm').addEventListener('submit', event => {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  if (username !== 'admin' || password !== adminPassword) return showToast('Incorrect admin login.', false);
  event.target.style.display = 'none';
  document.getElementById('adminTitle').textContent = 'Welcome, Admin';
  document.getElementById('adminPanel').style.display = 'block';
  renderAdminHostels();
  renderAdminUsers();
  renderAdminMessages();
  showToast('Admin login successful.');
});

document.getElementById('adminLogout').addEventListener('click', () => {
  document.getElementById('adminLoginForm').style.display = 'block';
  document.getElementById('adminLoginForm').reset();
  document.getElementById('adminTitle').textContent = 'Admin Login';
  document.getElementById('adminPanel').style.display = 'none';
});

function renderAdminHostels() {
  document.getElementById('adminHostelList').innerHTML = hostels.map(hostel => `
    <div class="admin-item"><strong>${escapeHtml(hostel.name)}</strong><br>KSh ${Number(hostel.price).toLocaleString()}
      <button data-edit-hostel="${hostel.id}" title="Edit">Edit</button>
      <button data-delete-hostel="${hostel.id}" title="Delete">×</button>
    </div>`).join('') || '<p>No hostels</p>';
}

function renderAdminUsers() {
  document.getElementById('adminUserList').innerHTML = users.map(user => `
    <div class="admin-item"><strong>${escapeHtml(user.username)}</strong><br>${escapeHtml(user.email)}
      <button data-delete-user="${user.id}" title="Delete account">×</button>
    </div>`).join('') || '<p>No accounts</p>';
}

function cleanPhone(phone) {
  return String(phone).replace(/[^0-9]/g, '').replace(/^0/, '254');
}

function renderAdminMessages() {
  const list = document.getElementById('adminMessageList');
  if (!list) return;
  list.innerHTML = messages.map(item => `
    <div class="admin-item message-item">
      <strong>${escapeHtml(item.name)}</strong>
      <a class="message-phone" href="tel:${escapeHtml(item.phone)}">📞 ${escapeHtml(item.phone)}</a>
      <a class="message-whatsapp" href="https://wa.me/${cleanPhone(item.phone)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <p>${escapeHtml(item.text)}</p>
      <small>${escapeHtml(item.date)}</small>
      <button data-delete-message="${item.id}" title="Delete message">×</button>
    </div>`).join('') || '<p>No student messages</p>';
}

document.getElementById('hostelForm').addEventListener('submit', event => {
  event.preventDefault();
  const id = document.getElementById('editingHostelId').value;
  const hostel = {
    id: id ? Number(id) : Date.now(),
    name: document.getElementById('hostelName').value.trim(),
    location: document.getElementById('hostelLocation').value.trim(),
    price: Number(document.getElementById('hostelPrice').value),
    image: document.getElementById('hostelImage').value.trim() || '🏠'
  };
  if (id) hostels = hostels.map(item => item.id === Number(id) ? hostel : item);
  else hostels.push(hostel);
  setData('kibabiiHostels', hostels);
  event.target.reset();
  document.getElementById('editingHostelId').value = '';
  renderHostels();
  renderAdminHostels();
  showToast(id ? 'Hostel updated successfully.' : 'Hostel added successfully.');
});

document.getElementById('adminHostelList').addEventListener('click', event => {
  const deleteId = event.target.dataset.deleteHostel;
  const editId = event.target.dataset.editHostel;
  if (deleteId) {
    hostels = hostels.filter(hostel => hostel.id !== Number(deleteId));
    setData('kibabiiHostels', hostels);
    renderHostels(); renderAdminHostels(); showToast('Hostel deleted.');
  }
  if (editId) {
    const hostel = hostels.find(item => item.id === Number(editId));
    document.getElementById('editingHostelId').value = hostel.id;
    document.getElementById('hostelName').value = hostel.name;
    document.getElementById('hostelLocation').value = hostel.location;
    document.getElementById('hostelPrice').value = hostel.price;
    document.getElementById('hostelImage').value = hostel.image;
  }
});

document.getElementById('adminUserList').addEventListener('click', event => {
  const id = event.target.dataset.deleteUser;
  if (!id) return;
  users = users.filter(user => user.id !== Number(id));
  setData('kibabiiUsers', users);
  renderAdminUsers();
  showToast('Account deleted.');
});

document.getElementById('adminPasswordForm').addEventListener('submit', event => {
  event.preventDefault();
  const currentPassword = document.getElementById('currentAdminPassword').value;
  const newPassword = document.getElementById('newAdminPassword').value;
  const confirmPassword = document.getElementById('confirmAdminPassword').value;

  if (currentPassword !== adminPassword) {
    return showToast('The current password is incorrect.', false);
  }
  if (newPassword !== confirmPassword) {
    return showToast('New passwords do not match.', false);
  }
  if (newPassword === adminPassword) {
    return showToast('Choose a password different from the current password.', false);
  }

  adminPassword = newPassword;
  localStorage.setItem('kibabiiAdminPassword', adminPassword);
  event.target.reset();
  showToast('Admin password changed successfully.');
});

document.getElementById('contactMessageForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('messageName').value.trim();
  const phone = document.getElementById('messagePhone').value.trim();
  const text = document.getElementById('messageText').value.trim();

  messages.unshift({
    id: Date.now(),
    name,
    phone,
    text,
    date: new Date().toLocaleString()
  });
  setData('kibabiiMessages', messages);
  event.target.reset();
  renderAdminMessages();
  showToast('Message sent successfully. The admin can call you.');
});

renderHostels();

const sections = [...document.querySelectorAll('.section')];
const navLinks = [...document.querySelectorAll('.nav-link')];
const sideLinks = [...document.querySelectorAll('.side-link[href]')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    sideLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
  });
}, { threshold: 0.45 });
sections.forEach(section => observer.observe(section));

document.querySelectorAll('a[href^="#"], .side-link[href]').forEach(link => {
  link.addEventListener('click', () => toggleSidebar(false));
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

document.getElementById('hostelGrid').addEventListener('click', event => {
  const button = event.target.closest('.contact-hostel');
  if (!button) return;
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  showToast(`Enquiry started for ${button.dataset.hostel}.`);
});

document.getElementById('adminMessageList').addEventListener('click', event => {
  const id = event.target.dataset.deleteMessage;
  if (!id) return;
  messages = messages.filter(item => item.id !== Number(id));
  setData('kibabiiMessages', messages);
  renderAdminMessages();
  showToast('Message deleted.');
});
