// -----------------------------------------
// MOBILE MENU
// -----------------------------------------
const mobileBtn = document.getElementById("mobileMenuBtn");
const navMobile = document.getElementById("navMobile");

if (mobileBtn && navMobile) {
  mobileBtn.addEventListener("click", () => {
    navMobile.classList.toggle("show");
  });

  navMobile.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navMobile.classList.remove("show"));
  });
}

// -----------------------------------------
// FAQ
// -----------------------------------------
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const btn = item.querySelector(".faq-question");
  btn.addEventListener("click", () => {
    faqItems.forEach((i) => i !== item && i.classList.remove("active"));
    item.classList.toggle("active");
  });
});

// -----------------------------------------
// FOOTER YEAR
// -----------------------------------------
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// -----------------------------------------
// CARRINHO BRASIL
// -----------------------------------------

let cart = [];
const CART_KEY = "gb_cart_br_v1";

const sidebarEl = document.getElementById("cartSidebar");
const overlayEl = document.getElementById("cartOverlay");
const itemsEl = document.getElementById("cart-items");
const totalEl = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartCountEl = document.getElementById("cartCount");
const toastEl = document.getElementById("cartToast");

// Função BR de formatação
function formatBR(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// Carregar carrinho
function loadCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      cart = JSON.parse(stored);
      renderCart();
    }
  } catch {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function openCart() {
  sidebarEl.style.right = "0";
  overlayEl.style.display = "block";
}

function closeCart() {
  sidebarEl.style.right = "-380px";
  overlayEl.style.display = "none";
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function showToast(text) {
  toastEl.textContent = text || "Produto adicionado 🍓";
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function updateCartCount() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEl.textContent = totalQty;
  cartCountEl.style.display = totalQty > 0 ? "flex" : "none";
}

function getCheckoutLink() {
  return cart.length > 0 ? cart[0].mpLink : "#";
}

// Renderização BR
function renderCart() {
  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
    totalEl.textContent = formatBR(0);
    checkoutBtn.style.display = "none";
    updateCartCount();
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    html += `
      <div class="cart-item">
        <img src="${item.image}" alt="Produto">

        <div class="cart-details">
          <span class="cart-title">${item.title}</span>
          <span class="cart-price">${formatBR(item.price)}</span>
          <div class="cart-qty-row">
            <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
          </div>
        </div>

        <button class="remove-item" onclick="removeItem(${index})">×</button>
      </div>
    `;
  });

  itemsEl.innerHTML = html;
  totalEl.textContent = formatBR(total);

  checkoutBtn.href = getCheckoutLink();
  checkoutBtn.textContent = "Finalizar a compra";
  checkoutBtn.style.display = "block";

  updateCartCount();
}

function changeQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function addToCart(title, price, paymentLink, imageUrl) {
  const existing = cart.find((item) => item.title === title);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      title,
      price,
      mpLink: paymentLink,
      image: imageUrl,
      qty: 1,
    });
  }

  saveCart();
  renderCart();
  openCart();
  showToast("Produto adicionado 🍓");
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

loadCart();
