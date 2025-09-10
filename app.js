// Data: sample menu
const MENU = [
  { 
    id: 'padthai', 
    name: 'ผัดไทย', 
    category: 'noodle', 
    basePrice: 65, 
    img: 'IMG/ผัดไทย.jpg',
    ingredients: [
      { name: 'กุ้ง', price: 0 },
      { name: 'หมู', price: 0 },
      { name: 'เนื้อ', price: 10 }
    ]
  },
  { 
    id: 'krapao', 
    name: 'กะเพรา', 
    category: 'rice', 
    basePrice: 60, 
    img: 'IMG/กะเพราไก่ไข่ดาว.jpg',
    ingredients: [
      { name: 'ไก่', price: 0 },
      { name: 'หมู', price: 0 },
      { name: 'เนื้อ', price: 10 }
    ]
  },
  { 
    id: 'tomyum', 
    name: 'ต้มยำ', 
    category: 'soup', 
    basePrice: 85, 
    img: 'IMG/ต้มยำกุ้ง.jpg',
    ingredients: [
      { name: 'กุ้ง', price: 0 },
      { name: 'หมู', price: 0 },
      { name: 'เนื้อ', price: 10 }
    ]
  },
  { 
    id: 'friedchicken', 
    name: 'ไก่ทอด', 
    category: 'rice', 
    basePrice: 55, 
    img: 'IMG/ไก่ทอด.jpg',
    ingredients: [
      { name: 'ไก่', price: 0 }
    ]
  },
  { 
    id: 'milktea', 
    name: 'ชานมไข่มุก', 
    category: 'drink', 
    basePrice: 45, 
    img: 'IMG/ชานมไข่มุก.jpg',
    ingredients: [
      { name: 'ไข่มุกปกติ', price: 0 },
      { name: 'ไข่มุกสี', price: 5 },
      { name: 'ไข่มุกเจลลี่', price: 10 }
    ]
  },
  { 
    id: 'lemontea', 
    name: 'ชามะนาว', 
    category: 'drink', 
    basePrice: 35, 
    img: 'IMG/ชามะนาว.jpg',
    ingredients: [
      { name: 'น้ำตาลปกติ', price: 0 },
      { name: 'น้ำตาลน้อย', price: 0 },
      { name: 'ไม่ใส่น้ำตาล', price: 0 }
    ]
  },
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
    const matchesPrice = item.basePrice <= state.maxPrice;
    return matchesText && matchesCat && matchesPrice;
  });
}
function renderMenu() {
  const items = filteredMenu();
  if (items.length === 0) {
    menuGrid.innerHTML = '<p class="small">ไม่พบเมนูตามเงื่อนไข</p>';
    return;
  }
  menuGrid.innerHTML = items.map(item => {
    const hasIngredients = item.ingredients.length > 0;
    const buttonText = hasIngredients ? 'เลือก' : 'ใส่ตะกร้า';
    const buttonClass = hasIngredients ? 'primary selectBtn' : 'primary addBtn';
    
    return `
      <article class="card" data-id="${item.id}">
        <img src="${item.img}" alt="${item.name}">
        <div class="content">
          <div class="inline" style="justify-content: space-between;">
            <h3 style="margin:0">${item.name}</h3>
            <span class="badge">${item.category}</span>
          </div>
          <div class="price">${formatBaht(item.basePrice)}</div>
          <div class="button-row">
            <button class="${buttonClass}" data-item-id="${item.id}">${buttonText}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}


const cartList = document.getElementById('cartList');
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount');
const totalEl = document.getElementById('total');

function cartEntries() { return Object.entries(state.cart); }
function cartSubtotal() {
  return cartEntries().reduce((sum, [cartKey, cartItem]) => {
    // Handle both old format (number) and new format (object)
    if (typeof cartItem === 'number') {
      // Old format - simple quantity
      const [id, ingredient] = cartKey.includes('-') ? cartKey.split('-') : [cartKey, ''];
      const item = MENU.find(m => m.id === id);
      if (!item) return sum;
      
      const ingredientPrice = ingredient ? 
        (item.ingredients.find(ing => ing.name === ingredient)?.price || 0) : 0;
      const totalPrice = item.basePrice + ingredientPrice;
      return sum + (totalPrice * cartItem);
    } else {
      // New format - detailed object
      const totalPrice = cartItem.basePrice + cartItem.proteinPrice + cartItem.extrasPrice;
      return sum + (totalPrice * cartItem.qty);
    }
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
  cartList.innerHTML = cartEntries().map(([cartKey, cartItem]) => {
    // Handle both old format (number) and new format (object)
    if (typeof cartItem === 'number') {
      // Old format - simple quantity
      const [id, ingredient] = cartKey.includes('-') ? cartKey.split('-') : [cartKey, ''];
      const item = MENU.find(m => m.id === id);
      if (!item) return '';
      
      const ingredientPrice = ingredient ? 
        (item.ingredients.find(ing => ing.name === ingredient)?.price || 0) : 0;
      const totalPrice = item.basePrice + ingredientPrice;
      const displayName = ingredient ? `${item.name} (${ingredient})` : item.name;
      
      return `
        <li class="cart-item" data-cart-key="${cartKey}">
          <div class="title">${displayName}</div>
          <div class="inline">
            <label for="cart-qty-${cartKey}" class="sr-only">จำนวน</label>
            <input id="cart-qty-${cartKey}" class="cart-qty" type="number" min="1" max="20" value="${cartItem}">
            <span>${formatBaht(totalPrice * cartItem)}</span>
          </div>
          <button class="removeBtn" aria-label="ลบ ${displayName}">ลบ</button>
        </li>
      `;
    } else {
      // New format - detailed object
      const totalPrice = cartItem.basePrice + cartItem.proteinPrice + cartItem.extrasPrice;
      
      return `
        <li class="cart-item" data-cart-key="${cartKey}">
          <div class="title">${cartItem.displayName}</div>
          <div class="inline">
            <label for="cart-qty-${cartKey}" class="sr-only">จำนวน</label>
            <input id="cart-qty-${cartKey}" class="cart-qty" type="number" min="1" max="20" value="${cartItem.qty}">
            <span>${formatBaht(totalPrice * cartItem.qty)}</span>
          </div>
          <button class="removeBtn" aria-label="ลบ ${cartItem.displayName}">ลบ</button>
        </li>
      `;
    }
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
const checkoutFormContainer = document.getElementById('checkoutFormContainer');
const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutMsg = document.getElementById('checkoutMsg');

// Popup elements - will be initialized after DOM loads
let ingredientPopup, closePopupBtn, cancelPopupBtn, addToCartBtn, popupTitle, popupImage, popupItemName, popupBasePrice;
let proteinSelect, spiceLevel, riceType, noodleType, drinkSize, iceLevel, specialRequest, quantity;
let summaryBasePrice, summaryProteinPrice, summaryExtrasPrice, summaryTotalPrice;

// Current item being customized
let currentItem = null;

// Initialize popup elements
function initializePopupElements() {
  ingredientPopup = document.getElementById('ingredientPopup');
  closePopupBtn = document.getElementById('closePopupBtn');
  cancelPopupBtn = document.getElementById('cancelPopupBtn');
  addToCartBtn = document.getElementById('addToCartBtn');
  popupTitle = document.getElementById('popupTitle');
  popupImage = document.getElementById('popupImage');
  popupItemName = document.getElementById('popupItemName');
  popupBasePrice = document.getElementById('popupBasePrice');
  proteinSelect = document.getElementById('proteinSelect');
  spiceLevel = document.getElementById('spiceLevel');
  riceType = document.getElementById('riceType');
  noodleType = document.getElementById('noodleType');
  drinkSize = document.getElementById('drinkSize');
  iceLevel = document.getElementById('iceLevel');
  specialRequest = document.getElementById('specialRequest');
  quantity = document.getElementById('quantity');
  summaryBasePrice = document.getElementById('summaryBasePrice');
  summaryProteinPrice = document.getElementById('summaryProteinPrice');
  summaryExtrasPrice = document.getElementById('summaryExtrasPrice');
  summaryTotalPrice = document.getElementById('summaryTotalPrice');
}


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


// Popup functions
function openIngredientPopup(item) {
  if (!ingredientPopup) {
    console.error('Popup element not found!');
    return;
  }
  
  currentItem = item;
  popupImage.src = item.img;
  popupImage.alt = item.name;
  popupItemName.textContent = item.name;
  popupBasePrice.textContent = formatBaht(item.basePrice);
  summaryBasePrice.textContent = formatBaht(item.basePrice);
  
  // Populate protein/ingredient options based on category
  const proteinLabel = document.getElementById('proteinLabel');
  if (item.category === 'drink') {
    proteinLabel.textContent = 'เลือกตัวเลือก:';
    proteinSelect.innerHTML = '<option value="">เลือกตัวเลือก</option>';
  } else {
    proteinLabel.textContent = 'เลือกเนื้อสัตว์:';
    proteinSelect.innerHTML = '<option value="">เลือกเนื้อสัตว์</option>';
  }
  
  item.ingredients.forEach(ing => {
    const option = document.createElement('option');
    option.value = ing.name;
    option.textContent = ing.name + (ing.price > 0 ? ` (+${formatBaht(ing.price)})` : '');
    option.dataset.price = ing.price;
    proteinSelect.appendChild(option);
  });
  
  // Show/hide relevant fields based on category
  const riceField = document.querySelector('#riceType').closest('.field');
  const noodleField = document.querySelector('#noodleType').closest('.field');
  const drinkOptionsField = document.getElementById('drinkOptions');
  const drinkIceField = document.getElementById('drinkIce');
  const spiceField = document.querySelector('#spiceLevel').closest('.field');
  const extrasField = document.getElementById('extraIngredients');
  
  if (item.category === 'rice') {
    riceField.style.display = 'block';
    noodleField.style.display = 'none';
    drinkOptionsField.style.display = 'none';
    drinkIceField.style.display = 'none';
    spiceField.style.display = 'block';
    extrasField.style.display = 'block';
  } else if (item.category === 'noodle') {
    riceField.style.display = 'none';
    noodleField.style.display = 'block';
    drinkOptionsField.style.display = 'none';
    drinkIceField.style.display = 'none';
    spiceField.style.display = 'block';
    extrasField.style.display = 'block';
  } else if (item.category === 'soup') {
    // Hide both rice and noodle options for soup
    riceField.style.display = 'none';
    noodleField.style.display = 'none';
    drinkOptionsField.style.display = 'none';
    drinkIceField.style.display = 'none';
    spiceField.style.display = 'block';
    extrasField.style.display = 'block';
  } else if (item.category === 'drink') {
    riceField.style.display = 'none';
    noodleField.style.display = 'none';
    drinkOptionsField.style.display = 'block';
    drinkIceField.style.display = 'block';
    spiceField.style.display = 'none';
    extrasField.style.display = 'none';
  } else {
    riceField.style.display = 'none';
    noodleField.style.display = 'none';
    drinkOptionsField.style.display = 'none';
    drinkIceField.style.display = 'none';
    spiceField.style.display = 'block';
    extrasField.style.display = 'block';
  }
  
  // Reset form
  document.getElementById('ingredientForm').reset();
  quantity.value = 1;
  spiceLevel.value = 'เผ็ดน้อย';
  
  updatePriceSummary();
  ingredientPopup.classList.remove('hidden');
  ingredientPopup.setAttribute('aria-hidden', 'false');
}

function closeIngredientPopup() {
  ingredientPopup.classList.add('hidden');
  ingredientPopup.setAttribute('aria-hidden', 'true');
  currentItem = null;
}

function updatePriceSummary() {
  if (!currentItem) return;
  
  const basePrice = currentItem.basePrice;
  const selectedProtein = proteinSelect.selectedOptions[0];
  const proteinPrice = selectedProtein ? Number(selectedProtein.dataset.price || 0) : 0;
  
  // Calculate drink size price
  const selectedSize = drinkSize.selectedOptions[0];
  const sizePrice = selectedSize ? Number(selectedSize.dataset.price || 0) : 0;
  
  // Calculate extras price
  const extras = document.querySelectorAll('input[name="extras"]:checked');
  let extrasPrice = 0;
  extras.forEach(extra => {
    const price = extra.value.includes('ไข่ดาว') ? 15 : 
                  extra.value.includes('ไข่เจียว') ? 10 : 5;
    extrasPrice += price;
  });
  
  const totalPrice = basePrice + proteinPrice + sizePrice + extrasPrice;
  
  summaryBasePrice.textContent = formatBaht(basePrice);
  summaryProteinPrice.textContent = formatBaht(proteinPrice);
  summaryExtrasPrice.textContent = formatBaht(extrasPrice + sizePrice);
  summaryTotalPrice.textContent = formatBaht(totalPrice);
}

function addCustomizedItemToCart() {
  if (!currentItem) return;
  
  const selectedProtein = proteinSelect.value;
  const selectedSpice = spiceLevel.value;
  const selectedRice = riceType.value;
  const selectedNoodle = noodleType.value;
  const selectedSize = drinkSize.value;
  const selectedIce = iceLevel.value;
  const extras = Array.from(document.querySelectorAll('input[name="extras"]:checked')).map(cb => cb.value);
  const special = specialRequest.value.trim();
  const qty = clamp(Number(quantity.value || 1), 1, 20);
  
  // Create detailed cart key
  const proteinKey = selectedProtein ? `-${selectedProtein}` : '';
  const sizeKey = selectedSize && selectedSize !== 'ขนาดปกติ' ? `-${selectedSize}` : '';
  const iceKey = selectedIce && selectedIce !== 'น้ำแข็งปกติ' ? `-${selectedIce}` : '';
  const extrasKey = extras.length > 0 ? `-${extras.join(',')}` : '';
  const cartKey = `${currentItem.id}${proteinKey}${sizeKey}${iceKey}${extrasKey}`;
  
  // Create item details for display
  const details = [];
  if (selectedProtein) details.push(selectedProtein);
  if (selectedSpice !== 'เผ็ดน้อย') details.push(selectedSpice);
  if (currentItem.category === 'rice' && selectedRice !== 'ข้าวสวย') details.push(selectedRice);
  if (currentItem.category === 'noodle' && selectedNoodle !== 'เส้นใหญ่') details.push(selectedNoodle);
  if (selectedSize && selectedSize !== 'ขนาดปกติ') details.push(selectedSize);
  if (selectedIce && selectedIce !== 'น้ำแข็งปกติ') details.push(selectedIce);
  if (extras.length > 0) details.push(...extras);
  if (special) details.push(`(${special})`);
  
  const displayName = details.length > 0 ? `${currentItem.name} (${details.join(', ')})` : currentItem.name;
  
  // Calculate prices
  const proteinPrice = selectedProtein ? Number(proteinSelect.selectedOptions[0]?.dataset.price || 0) : 0;
  const sizePrice = selectedSize ? Number(drinkSize.selectedOptions[0]?.dataset.price || 0) : 0;
  const extrasPrice = extras.reduce((sum, extra) => {
    return sum + (extra.includes('ไข่ดาว') ? 15 : extra.includes('ไข่เจียว') ? 10 : 5);
  }, 0);
  
  // Store in cart with detailed information
  state.cart[cartKey] = {
    qty: (state.cart[cartKey]?.qty || 0) + qty,
    displayName: displayName,
    basePrice: currentItem.basePrice,
    proteinPrice: proteinPrice,
    extrasPrice: extrasPrice + sizePrice,
    special: special
  };
  
  saveCart();
  renderCart();
  closeIngredientPopup();
}

// Initialize popup elements and event listeners
function initializePopupEventListeners() {
  if (closePopupBtn) closePopupBtn.addEventListener('click', closeIngredientPopup);
  if (cancelPopupBtn) cancelPopupBtn.addEventListener('click', closeIngredientPopup);
  if (addToCartBtn) addToCartBtn.addEventListener('click', addCustomizedItemToCart);

  // Close popup when clicking overlay
  if (ingredientPopup) {
    ingredientPopup.addEventListener('click', (e) => {
      if (e.target === ingredientPopup || e.target.classList.contains('popup-overlay')) {
        closeIngredientPopup();
      }
    });
  }

  // Update price summary when form changes
  const ingredientForm = document.getElementById('ingredientForm');
  if (ingredientForm) {
    ingredientForm.addEventListener('change', updatePriceSummary);
    ingredientForm.addEventListener('input', updatePriceSummary);
  }
}

menuGrid.addEventListener('click', (e) => {
  const selectBtn = e.target.closest('.selectBtn');
  const addBtn = e.target.closest('.addBtn');
  
  if (selectBtn) {
    const card = selectBtn.closest('.card');
    const id = card?.dataset.id;
    const item = MENU.find(m => m.id === id);
    if (item) {
      openIngredientPopup(item);
    }
  } else if (addBtn) {
    const card = addBtn.closest('.card');
    const id = card?.dataset.id;
    
    state.cart[id] = (state.cart[id] || 0) + 1; 
    saveCart(); 
    renderCart();
  }
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
    const cartKey = li?.dataset.cartKey;
    const qty = clamp(Number(qtyInput.value || 1), 1, 20);
    
    // Handle both old and new cart formats
    if (typeof state.cart[cartKey] === 'number') {
      state.cart[cartKey] = qty;
    } else {
      state.cart[cartKey].qty = qty;
    }
    saveCart(); 
    renderCart();
  }
});
cartList.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.removeBtn');
  if (removeBtn) {
    const li = removeBtn.closest('.cart-item');
    const cartKey = li?.dataset.cartKey; 
    delete state.cart[cartKey]; 
    saveCart(); 
    renderCart();
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
  checkoutFormContainer.classList.remove('hidden');
  document.getElementById('customerName').focus();
});

closeCheckoutBtn.addEventListener('click', () => {
  checkoutFormContainer.classList.add('hidden');
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
  const summary = cartEntries().map(([cartKey, cartItem]) => {
    if (typeof cartItem === 'number') {
      // Old format
      const [id, ingredient] = cartKey.includes('-') ? cartKey.split('-') : [cartKey, ''];
      const item = MENU.find(m => m.id === id);
      const displayName = ingredient ? `${item?.name} (${ingredient})` : item?.name;
      return `${displayName} x${cartItem}`;
    } else {
      // New format
      return `${cartItem.displayName} x${cartItem.qty}`;
    }
  }).join(', ');
  const { total } = cartTotal();
  alert(
    `ขอบคุณค่ะ \nผู้สั่ง: ${name} (${phone})\nรับแบบ: ${method === 'delivery' ? 'จัดส่ง' : 'รับเอง'}${schedule ? ` เวลา ${schedule}` : ''}\nที่อยู่: ${address}\nเมนู: ${summary}\nยอดสุทธิ: ${formatBaht(total)}`
  );
  state.cart = {}; saveCart(); renderCart();
  checkoutForm.reset(); checkoutFormContainer.classList.add('hidden');
});

// Initialize everything
initializePopupElements();
initializePopupEventListeners();
renderMenu();
renderCart();


