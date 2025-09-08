// Data: sample menu
const MENU = [
  { id: 'padthai', name: 'ผัดไทย', category: 'noodle', price: 65, img: 'IMG/ผัดไทย.jpg' },
  { id: 'krapao', name: 'กะเพราไก่ไข่ดาว', category: 'rice', price: 60, img: 'IMG/กะเพราไก่ไข่ดาว.jpg' },
  { id: 'tomyum', name: 'ต้มยำกุ้ง', category: 'noodle', price: 85, img: 'IMG/ต้มยำกุ้ง.jpg' },
  { id: 'friedchicken', name: 'ไก่ทอด', category: 'rice', price: 55, img: 'IMG/ไก่ทอด.jpg' },
  { id: 'milktea', name: 'ชานมไข่มุก', category: 'drink', price: 45, img: 'IMG/ชานมไข่มุก.jpg' },
  { id: 'lemontea', name: 'ชามะนาว', category: 'drink', price: 35, img: 'IMG/ชามะนาว.jpg' },
];

const state = {
  query: '',
  category: 'all',
  maxPrice: 200,
  cart: loadCart(),
  promo: null,
};

function loadCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '{}'); } catch { return {}; }
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }


const formatBaht = num => `฿${num.toFixed(2)}`;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));


const menuGrid = document.getElementById('menuGrid');
function filteredMenu() {
  return MENU.filter(item => {
    const matchesText = item.name.toLowerCase().includes(state.query.toLowerCase());
    const matchesCat = state.category === 'all' || item.category === state.category;
    const matchesPrice = item.price <= state.maxPrice;
    return matchesText && matchesCat && matchesPrice;
  });
}
function renderMenu() {
  const items = filteredMenu();
  if (items.length === 0) {
    menuGrid.innerHTML = '<p class="small">ไม่พบเมนูตามเงื่อนไข</p>';
    return;
  }
  menuGrid.innerHTML = items.map(item => `
    <article class="card" data-id="${item.id}">
      <img src="${item.img}" alt="${item.name}">
      <div class="content">
        <div class="inline" style="justify-content: space-between;">
          <h3 style="margin:0">${item.name}</h3>
          <span class="badge">${item.category}</span>
        </div>
        <div class="price">${formatBaht(item.price)}</div>
        <div class="qty-row">
          <label for="qty-${item.id}" class="sr-only">จำนวน</label>
          <input id="qty-${item.id}" type="number" min="1" max="20" value="1">
          <button class="primary addBtn">ใส่ตะกร้า</button>
        </div>
      </div>
    </article>
  `).join('');
}


const cartList = document.getElementById('cartList');
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount');
const totalEl = document.getElementById('total');

function cartEntries() { return Object.entries(state.cart); }
function cartSubtotal() {
  return cartEntries().reduce((sum, [id, qty]) => {
    const item = MENU.find(m => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
}
function promoDiscount(subtotal) {
  if (!state.promo) return 0;
  if (state.promo === 'EAT10') return subtotal * 0.10;
  if (state.promo === 'FREECHA' && subtotal >= 150) {
    const drink = MENU.find(m => m.category === 'drink');
    return drink ? Math.min(drink.price, subtotal) : 0;
  }
  return 0;
}
function cartTotal() {
  const sub = cartSubtotal();
  const disc = promoDiscount(sub);
  return { sub, disc, total: clamp(sub - disc, 0, Number.POSITIVE_INFINITY) };
}
function renderCart() {
  cartList.innerHTML = cartEntries().map(([id, qty]) => {
    const item = MENU.find(m => m.id === id);
    if (!item) return '';
    return `
      <li class="cart-item" data-id="${id}">
        <div class="title">${item.name}</div>
        <div class="inline">
          <label for="cart-qty-${id}" class="sr-only">จำนวน</label>
          <input id="cart-qty-${id}" class="cart-qty" type="number" min="1" max="20" value="${qty}">
          <span>${formatBaht(item.price * qty)}</span>
        </div>
        <button class="removeBtn" aria-label="ลบ ${item.name}">ลบ</button>
      </li>
    `;
  }).join('');

  const { sub, disc, total } = cartTotal();
  subtotalEl.textContent = formatBaht(sub);
  discountEl.textContent = `- ${formatBaht(disc)}`;
  totalEl.textContent = formatBaht(total);
}

const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const priceRange = document.getElementById('priceRange');
const priceRangeLabel = document.getElementById('priceRangeLabel');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const promoForm = document.getElementById('promoForm');
const promoInput = document.getElementById('promoInput');
const promoMsg = document.getElementById('promoMsg');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutToggleBtn = document.getElementById('checkoutToggleBtn');
const checkoutPanel = document.getElementById('checkoutPanel');
const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutMsg = document.getElementById('checkoutMsg');


searchInput.addEventListener('input', (e) => { state.query = e.target.value; renderMenu(); });

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const firstBtn = menuGrid.querySelector('.addBtn');
    if (firstBtn) firstBtn.focus();
  }
});

categorySelect.addEventListener('change', (e) => { state.category = e.target.value; renderMenu(); });

function updatePriceLabel() { priceRangeLabel.textContent = `0 - ฿${priceRange.value}`; }
priceRange.addEventListener('input', (e) => { state.maxPrice = Number(e.target.value); updatePriceLabel(); renderMenu(); });
updatePriceLabel();

document.getElementById('searchForm').addEventListener('reset', () => {
  setTimeout(() => { 
    state.query = '';
    state.category = 'all';
    state.maxPrice = 200;
    priceRange.value = 200; updatePriceLabel();
    renderMenu();
  });
});


menuGrid.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.addBtn');
  if (!addBtn) return;
  const card = addBtn.closest('.card');
  const id = card?.dataset.id;
  const qtyInput = card?.querySelector('input[type="number"]');
  const qty = clamp(Number(qtyInput?.value || 1), 1, 20);
  state.cart[id] = (state.cart[id] || 0) + qty; saveCart(); renderCart();
});

menuGrid.addEventListener('mouseover', (e) => {
  const card = e.target.closest('.card');
  if (card) card.style.transform = 'translateY(-2px)';
});
menuGrid.addEventListener('mouseout', (e) => {
  const card = e.target.closest('.card');
  if (card) card.style.transform = '';
});


cartList.addEventListener('input', (e) => {

  const qtyInput = e.target.closest('.cart-qty');
  if (qtyInput) {
    const li = qtyInput.closest('.cart-item');
    const id = li?.dataset.id;
    const qty = clamp(Number(qtyInput.value || 1), 1, 20);
    state.cart[id] = qty; saveCart(); renderCart();
  }
});
cartList.addEventListener('click', (e) => {

  const removeBtn = e.target.closest('.removeBtn');
  if (removeBtn) {
    const li = removeBtn.closest('.cart-item');
    const id = li?.dataset.id; delete state.cart[id]; saveCart(); renderCart();
  }
});

clearCartBtn.addEventListener('click', () => { state.cart = {}; saveCart(); renderCart(); });

promoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = promoInput.value.trim().toUpperCase();
  const valid = ['EAT10', 'FREECHA'];
  if (!valid.includes(code)) {
    state.promo = null; promoMsg.textContent = 'โค้ดไม่ถูกต้อง'; renderCart(); return;
  }
  state.promo = code; promoMsg.textContent = code === 'EAT10' ? 'ลด 10%' : 'รับเครื่องดื่มฟรีเมื่อยอดถึง 150฿'; renderCart();
});


toggleThemeBtn.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
});


checkoutToggleBtn.addEventListener('click', () => {
  checkoutPanel.classList.remove('hidden');
  checkoutPanel.setAttribute('aria-hidden', 'false');
  document.getElementById('customerName').focus();
});

closeCheckoutBtn.addEventListener('click', () => {
  checkoutPanel.classList.add('hidden');
  checkoutPanel.setAttribute('aria-hidden', 'true');
});

checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  checkoutMsg.textContent = '';
  const form = new FormData(checkoutForm);
  const name = String(form.get('name') || '').trim();
  const phone = String(form.get('phone') || '').trim();
  const address = String(form.get('address') || '').trim();
  const method = String(form.get('method') || 'delivery');
  const schedule = String(form.get('schedule') || '');
  if (!name || !phone || !address) {
    checkoutMsg.textContent = 'กรุณากรอกข้อมูลให้ครบถ้วน';
    return;
  }
  if (cartEntries().length === 0) {
    checkoutMsg.textContent = 'ตะกร้าว่าง กรุณาเลือกเมนูก่อน';
    return;
  }
  const summary = cartEntries().map(([id, qty]) => {
    const item = MENU.find(m => m.id === id);
    return `${item?.name} x${qty}`;
  }).join(', ');
  const { total } = cartTotal();
  alert(
    `ขอบคุณค่ะ \nผู้สั่ง: ${name} (${phone})\nรับแบบ: ${method === 'delivery' ? 'จัดส่ง' : 'รับเอง'}${schedule ? ` เวลา ${schedule}` : ''}\nที่อยู่: ${address}\nเมนู: ${summary}\nยอดสุทธิ: ${formatBaht(total)}`
  );
  state.cart = {}; saveCart(); renderCart();
  checkoutForm.reset(); checkoutPanel.classList.add('hidden'); checkoutPanel.setAttribute('aria-hidden', 'true');
});

renderMenu();
renderCart();


