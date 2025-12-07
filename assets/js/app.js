/* assets/js/app.js - Huniankita (Premium UI)
   Features:
   - Mobile nav toggle
   - Lead form (hero)
   - Cart: add, remove, qty, persist (localStorage)
   - Checkout summary & auto-fill from ?item=... URL
   - Checkout -> WhatsApp auto-send (with invoice)
   - Save orders locally (simulated backend)
   - trackOrder() helper (calls backend API if exists)
*/

/* =========================
   CONFIG
   ========================= */
const ADMIN_WA = "628115134386"; // <-- GANTI dengan nomor admin (62... tanpa + / 0)
const STORAGE_CART_KEY = "huniankita_cart_v1";
const STORAGE_ORDERS_KEY = "huniankita_orders_v1";

/* =========================
   HELPERS
   ========================= */
function toRupiah(num){
  if (!num && num !== 0) return "Rp 0";
  return "Rp " + Number(num).toLocaleString("id-ID");
}
function formatNumber(n){ return Number(n || 0); }
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }

/* =========================
   CART STORAGE
   ========================= */
function loadCart(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CART_KEY) || "[]");
  } catch(e){
    return [];
  }
}
function saveCart(cart){
  localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
}

/* add item: expects {id,name,price,qty,meta} */
function addToCart(item){
  const cart = loadCart();
  const exists = cart.find(i => i.id === item.id);
  if(exists){
    exists.qty = (exists.qty || 1) + (item.qty || 1);
  } else {
    item.qty = item.qty || 1;
    cart.push(item);
  }
  saveCart(cart);
  renderCartCount();
}

/* remove by id */
function removeFromCart(id){
  let cart = loadCart();
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCartCount();
}

/* update qty */
function updateQty(id, qty){
  const cart = loadCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = qty;
  if(item.qty <= 0) removeFromCart(id);
  saveCart(cart);
  renderCartCount();
}

/* cart count */
function renderCartCount(){
  const cart = loadCart();
  const count = cart.reduce((s,i)=>s+(i.qty||0),0);
  qsa(".cart-count").forEach(el => el.innerText = count);
}

/* render checkout summary */
function renderCheckoutSummary(){
  const summaryEl = qs("#checkout-items");
  const totalEl = qs("#checkout-total");
  if(!summaryEl || !totalEl) return;

  const urlItem = getParam("item"); // optional
  let cart = loadCart();

  // if ?item param present and cart empty, prefill single item
  if(cart.length === 0 && urlItem){
    // try parse name/price from mapping in page (data attributes on links) OR fallback
    const el = document.querySelector(`[data-item-id="${urlItem}"]`);
    if(el){
      const name = el.dataset.itemName || el.textContent || urlItem;
      const price = Number(el.dataset.itemPrice || 0);
      cart = [{ id: urlItem, name, price, qty: 1 }];
    } else {
      // fallback: create a readable name/price from urlItem pattern
      cart = [{ id: urlItem, name: urlItem, price: 0, qty:1 }];
    }
  }

  summaryEl.innerHTML = "";
  let total = 0;
  cart.forEach(it => {
    const line = document.createElement("div");
    line.className = "checkout-line";
    line.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div>
          <strong>${it.name}</strong><br><small>${it.qty} × ${toRupiah(it.price)}</small>
        </div>
        <div>
          <button class="btn small remove-item" data-id="${it.id}">Hapus</button>
        </div>
      </div>
    `;
    summaryEl.appendChild(line);
    total += (formatNumber(it.price) * (it.qty || 1));
  });

  totalEl.innerText = toRupiah(total);

  // attach remove handlers
  qsa(".remove-item").forEach(btn=>{
    btn.addEventListener("click", function(){
      const id = this.dataset.id;
      removeFromCart(id);
      renderCheckoutSummary();
    });
  });
}

/* =========================
   INVOICE / ORDER SAVE (local simulation)
   ========================= */
function generateInvoiceId(){
  const ts = Date.now();
  const rnd = Math.floor(Math.random()*900 + 100);
  return `INV-${ts}-${rnd}`;
}
function saveOrderLocal(order){
  // order: {invoice, items, total, name, phone, email, address, status, created_at}
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || "[]");
    list.push(order);
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(list));
  } catch(e){
    // ignore
  }
}

/* =========================
   WHATSAPP CHECKOUT
   ========================= */
function checkoutToWhatsApp(formEl){
  const name = (formEl.querySelector("[name=name]") || formEl.querySelector("[name=nama]") || {}).value || "";
  const phone = (formEl.querySelector("[name=phone]") || formEl.querySelector("[name=whatsapp]") || {}).value || "";
  const email = (formEl.querySelector("[name=email]") || {}).value || "";
  const address = (formEl.querySelector("[name=address]") || formEl.querySelector("[name=alamat]") || {}).value || "";
  const note = (formEl.querySelector("[name=note]") || formEl.querySelector("[name=note]") || {}).value || "";

  const cart = loadCart();
  const urlItem = getParam("item");
  let items = cart.slice();

  if(items.length === 0 && urlItem){
    // try to get info from page element
    const e = document.querySelector(`[data-item-id="${urlItem}"]`);
    if(e){
      items = [{ id: urlItem, name: e.dataset.itemName || urlItem, price: Number(e.dataset.itemPrice || 0), qty:1 }];
    } else {
      items = [{ id: urlItem, name: urlItem, price: 0, qty:1 }];
    }
  }

  if(items.length === 0){
    alert("Keranjang kosong. Pilih minimal 1 unit.");
    return;
  }

  const invoice = generateInvoiceId();
  let total = 0;
  const lines = items.map(it => {
    const lineTotal = (formatNumber(it.price) * (it.qty || 1));
    total += lineTotal;
    return `- ${it.name} x${it.qty} : ${toRupiah(lineTotal)}`;
  }).join("\n");

  // Save order locally (simulate)
  const order = {
    invoice,
    items,
    total,
    name,
    phone,
    email,
    address,
    note,
    status: "Pending",
    created_at: new Date().toISOString()
  };
  saveOrderLocal(order);

  // compose WA message
  const text = [
    "Halo Admin HunianKita,",
    "",
    `Saya ingin memesan rumah. (Invoice: ${invoice})`,
    "",
    lines,
    "",
    `Total: ${toRupiah(total)}`,
    "",
    "Data Pembeli:",
    `Nama: ${name}`,
    `Email: ${email}`,
    `WhatsApp: ${phone}`,
    `Alamat: ${address}`,
    note ? `Catatan: ${note}` : "",
    "",
    "Mohon info selanjutnya, terima kasih."
  ].filter(Boolean).join("\n");

  const waUrl = "https://wa.me/" + ADMIN_WA + "?text=" + encodeURIComponent(text);

  // open WA in new tab
  window.open(waUrl, "_blank");

  // clear cart after checkout
  localStorage.removeItem(STORAGE_CART_KEY);
  renderCartCount();
  renderCheckoutSummary();
  alert("Pesanan disimpan sementara (local). WhatsApp telah dibuka untuk mengirim pesan.");
}

/* =========================
   TRACK ORDER (API-friendly)
   ========================= */
async function trackOrderAPI(invoice){
  // Try backend API first
  try {
    const resp = await fetch(`backend/api/track.php?id=${encodeURIComponent(invoice)}`);
    if(!resp.ok) throw new Error("Network");
    const json = await resp.json();
    return json; // expected { invoice, status, total }
  } catch(e){
    // fallback to local storage lookup
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || "[]");
      const found = list.find(o => o.invoice === invoice);
      if(found) return { invoice: found.invoice, status: found.status, total: found.total };
    } catch(err){ /* ignore */ }
    return null;
  }
}

/* =========================
   BOOTSTRAP: attach events
   ========================= */
document.addEventListener("DOMContentLoaded", function(){

  /* NAV TOGGLE - for mobile */
  const navToggle = qs(".nav-toggle");
  if(navToggle){
    navToggle.addEventListener("click", function(){
      const nav = document.querySelector(".nav") || document.querySelector("header nav");
      if(!nav) return;
      if(nav.style.display === "block") nav.style.display = "";
      else nav.style.display = "block";
    });
  }

  /* LEAD FORM (hero) if present */
  const leadForm = qs("#leadForm");
  if(leadForm){
    leadForm.addEventListener("submit", function(e){
      e.preventDefault();
      const name = (this.querySelector("#lead-name") || {}).value || "";
      const phone = (this.querySelector("#lead-phone") || {}).value || "";
      alert(`Terima kasih ${name}. Tim kami akan menghubungi ${phone} dalam 1x24 jam.`);
      this.reset();
    });
  }

  /* ADD TO CART buttons (data attributes expected)
     Example markup:
     <button class="add-cart" data-id="subsidiA" data-name="Subsidi A" data-price="168000000">Tambah</button>
  */
  qsa(".add-cart").forEach(btn=>{
    btn.addEventListener("click", function(e){
      const id = this.dataset.id || this.getAttribute("data-id");
      const name = this.dataset.name || this.getAttribute("data-name") || (this.textContent || "Item");
      const price = Number(this.dataset.price || this.getAttribute("data-price") || 0);
      addToCart({ id, name, price, qty: 1 });
      alert(`${name} telah ditambahkan ke keranjang.`);
      renderCheckoutSummary();
    });
  });

  /* Render cart count & summary on load */
  renderCartCount();
  renderCheckoutSummary();

  /* Checkout form handler */
  const checkoutForm = qs("#checkoutForm");
  if(checkoutForm){
    checkoutForm.addEventListener("submit", function(e){
      e.preventDefault();
      checkoutToWhatsApp(this);
    });
  }

  /* If there's a remove from cart button in other places */
  qsa(".remove-cart").forEach(btn=>{
    btn.addEventListener("click", function(){
      const id = this.dataset.id;
      removeFromCart(id);
      renderCheckoutSummary();
    });
  });

  /* Tracking form (if present on page) */
  const trackingForm = qs("#trackingForm");
  if(trackingForm){
    trackingForm.addEventListener("submit", async function(e){
      e.preventDefault();
      const code = (this.querySelector("[name=kode]") || {}).value || "";
      const resultEl = qs("#result");
      const statusEl = qs("#statusText");
      resultEl.style.display = "block";
      const data = await trackOrderAPI(code);
      if(data){
        statusEl.innerHTML = `<b>${data.invoice || code}</b><br>${data.status || "Status: -"}<br>Total: ${toRupiah(data.total||0)}`;
        // show WA tracking button if present
        const waBtn = qs("#waBtn");
        if(waBtn){
          waBtn.style.display = "inline-block";
          waBtn.onclick = function(){
            const msg = `Halo Admin, saya ingin tracking pesanan.\nKode: ${code}`;
            window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, "_blank");
          };
        }
      } else {
        statusEl.innerHTML = `<b>${code}</b><br>❌ Tidak ditemukan.`;
      }
    });
  }

  /* If page provides quick-buy links with data attributes,
     allow prefill checkout by clicking those links. Example usage in pricing.html:
     <a href="checkout.html?item=clusterA" data-item-id="clusterA" data-item-name="Cluster A" data-item-price="350000000">Pesan</a>
  */
  qsa("[data-item-id]").forEach(el=>{
    el.addEventListener("click", function(){
      // no-op; attributes are read on checkout rendering
    });
  });

}); // DOMContentLoaded
// GENERATE PDF INVOICE
document.getElementById("btnInvoice").addEventListener("click", async function () {

    // ambil data dari form
    const name = document.getElementById("name").value;
    const wa = document.getElementById("whatsapp").value;
    const address = document.getElementById("address").value;
    const unit = localStorage.getItem("checkoutUnit");
    const price = localStorage.getItem("checkoutPrice");

    // isi invoice
    document.getElementById("invName").innerText = name;
    document.getElementById("invWA").innerText = wa;
    document.getElementById("invAddress").innerText = address;
    document.getElementById("invUnit").innerText = unit;
    document.getElementById("invPrice").innerText = "Rp " + Number(price).toLocaleString("id-ID");

    const invoice = document.getElementById("invoiceArea");
    invoice.style.display = "block"; // tampilkan sebelum screenshot

    // konversi ke canvas
    const canvas = await html2canvas(invoice, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // generate PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.height / canvas.width;
    const imgHeight = imgWidth * ratio;

    pdf.addImage(imgData, "PNG", (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);
    pdf.save("Invoice-HunianKita.pdf");

    invoice.style.display = "none"; // sembunyikan kembali
});
