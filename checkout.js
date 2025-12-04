// === LER CARRINHO EXISTENTE ===
const CART_KEY = "gb_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

const cart = loadCart();
const summaryItemsEl = document.getElementById("summaryItems");
const subtotalEl = document.getElementById("summarySubtotal");
const shippingEl = document.getElementById("summaryShipping");
const totalEl = document.getElementById("summaryTotal");
const shippingBadgeEl = document.getElementById("shippingBadge");

// frete: grátis acima de 300 reais, senão 19,90
const FREE_SHIPPING_THRESHOLD = 30000; // em centavos
const SHIPPING_FIXED = 1990; // 19,90

let subtotal = 0;
cart.forEach((item) => {
  subtotal += item.price * item.qty; // price em centavos (mesmo padrão do seu site)
});

let shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FIXED;
let total = subtotal + shipping;

function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// renderizar resumo
function renderSummary() {
  if (!cart.length) {
    summaryItemsEl.innerHTML =
      '<p style="font-size:0.9rem;color:#7b5b6b;">Seu carrinho está vazio.</p>';
    return;
  }

  summaryItemsEl.innerHTML = cart
    .map(
      (item) => `
      <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:6px;">
        <span>${item.qty}x ${item.title}</span>
        <span>${formatBRL(item.price * item.qty)}</span>
      </div>
    `
    )
    .join("");

  subtotalEl.textContent = formatBRL(subtotal);
  shippingEl.textContent = shipping === 0 ? "Grátis" : formatBRL(shipping);
  totalEl.textContent = formatBRL(total);
  shippingBadgeEl.style.display = shipping === 0 ? "block" : "none";
}

renderSummary();

// === CONTROLE DE ETAPAS ===
function goToStep(step) {
  [1, 2, 3].forEach((n) => {
    document.getElementById("step" + n).style.display =
      n === step ? "block" : "none";
    document
      .getElementById("stepPill" + n)
      .classList.toggle("step-active", n === step);
  });
}
window.goToStep = goToStep; // usado no HTML

// === TIMER (20 minutos) ===
const timerEl = document.getElementById("checkoutTimer");
let remaining = 20 * 60;
setInterval(() => {
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
  if (remaining > 0) remaining--;
}, 1000);

// === ENVIO PARA BACKEND MERCADO PAGO ===
const formEl = document.getElementById("checkoutForm");
const payBtn = document.getElementById("payButton");
const errorEl = document.getElementById("checkoutError");

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.style.display = "none";

  if (!cart.length) {
    errorEl.textContent = "Seu carrinho está vazio.";
    errorEl.style.display = "block";
    return;
  }

  const data = new FormData(formEl);
  const payload = {
    customer: {
      fullName: data.get("fullName"),
      email: data.get("email"),
      cpf: data.get("cpf"),
      phone: data.get("phone"),
      cep: data.get("cep"),
      street: data.get("street"),
      number: data.get("number"),
      district: data.get("district"),
      cityState: data.get("cityState"),
      complement: data.get("complement"),
    },
    payMethod: data.get("payMethod"), // "pix" ou "card"
    cart,
    totals: {
      subtotal,
      shipping,
      total,
    },
  };

  payBtn.disabled = true;
  payBtn.textContent = "Gerando checkout seguro...";

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Erro ao criar checkout.");

    const json = await res.json();
    if (!json.init_point) {
      throw new Error("Resposta inválida do servidor.");
    }

    // redirecionar para checkout pro do Mercado Pago
    window.location.href = json.init_point;
  } catch (err) {
    console.error(err);
    errorEl.textContent =
      "Não foi possível iniciar o pagamento. Tente novamente em alguns instantes.";
    errorEl.style.display = "block";
    payBtn.disabled = false;
    payBtn.textContent = "Pagar agora (Pix ou cartão)";
  }
});
