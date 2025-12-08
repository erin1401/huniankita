
/* assets/js/app.js - Huniankita V4 (production-ready frontend script)
   - Replace ADMIN_WA below with your admin WhatsApp (e.g. 6281234567890)
*/
const ADMIN_WA = "628115134386"; // <- REPLACE
const CART_KEY = "huniankita_cart_v4";
const ORDERS_KEY = "huniankita_orders_v4";
const REPO_USER = "erin1401";
const REPO_NAME = "huniankita";
const REPO_IMG_FOLDER = "assets/img";

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
function toRupiah(n){ return "Rp " + Number(n||0).toLocaleString("id-ID"); }
function getParam(k){ return new URLSearchParams(window.location.search).get(k); }

function loadCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY)||"[]")}catch(e){return []} }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)) }
function renderCartCount(){ const count = loadCart().reduce((s,i)=>s+(i.qty||0),0); qsa(".cart-count").forEach(el=>el.innerText = count) }
function addToCart(id,name,price){ const cart = loadCart(); const ex = cart.find(i=>i.id===id); if(ex) ex.qty=(ex.qty||1)+1; else cart.push({id,name,price: Number(price||0), qty:1}); saveCart(cart); renderCartCount(); alert(name + ' ditambahkan ke keranjang'); }
function clearCart(){ localStorage.removeItem(CART_KEY); renderCartCount(); }

function renderCheckoutSummary(){ const summary = qs("#checkout-items"); const totalEl = qs("#checkout-total"); if(!summary || !totalEl) return; let cart = loadCart(); const urlItem = getParam('item'); if(cart.length===0 && urlItem){ const el = document.querySelector('[data-item-id="'+urlItem+'"]'); if(el) cart=[{id:urlItem,name:el.dataset.itemName||urlItem,price:Number(el.dataset.itemPrice||0),qty:1}]; else cart=[{id:urlItem,name:urlItem,price:0,qty:1}]; } summary.innerHTML=''; let total=0; cart.forEach(it=>{ total += Number(it.price)*(it.qty||1); const div = document.createElement('div'); div.style.display='flex'; div.style.justifyContent='space-between'; div.style.marginBottom='10px'; div.innerHTML = '<div><strong>'+it.name+'</strong><br><small>'+it.qty+' × '+toRupiah(it.price)+'</small></div><div><button class="btn btn-outline remove-item" data-id="'+it.id+'">Hapus</button></div>'; summary.appendChild(div); }); totalEl.innerText = toRupiah(total); qsa('.remove-item').forEach(b=>b.addEventListener('click', function(){ const id=this.dataset.id; let c=loadCart(); c=c.filter(i=>i.id!==id); saveCart(c); renderCheckoutSummary(); renderCartCount(); })) }

function generateInvoiceId(){ return 'INV-' + Date.now(); }
function loadOrders(){ try{return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]')}catch(e){return []} }
function saveOrders(list){ localStorage.setItem(ORDERS_KEY, JSON.stringify(list)) }

function checkoutToWhatsApp(form){ const name = (form.querySelector('[name=name]')||{}).value || ''; const phone = (form.querySelector('[name=whatsapp]')||form.querySelector('[name=phone]')||{}).value || ''; const email = (form.querySelector('[name=email]')||{}).value || ''; const address = (form.querySelector('[name=address]')||form.querySelector('[name=alamat]')||{}).value || ''; const note = (form.querySelector('[name=note]')||{}).value || ''; let items = loadCart(); const urlItem = getParam('item'); if(items.length===0 && urlItem){ const el = document.querySelector('[data-item-id="'+urlItem+'"]'); if(el) items=[{id:urlItem,name:el.dataset.itemName||urlItem,price:Number(el.dataset.itemPrice||0),qty:1}]; else items=[{id:urlItem,name:urlItem,price:0,qty:1}]; } if(items.length===0){ alert('Keranjang kosong'); return; } const invoice = generateInvoiceId(); let total=0; const lines = items.map(it=>{ const lt = Number(it.price)*(it.qty||1); total += lt; return '- '+it.name+' x'+it.qty+' : '+toRupiah(lt); }).join('\n'); const order = { invoice, items, total, name, phone, email, address, note, status:'Pending', created_at:new Date().toISOString() }; const orders = loadOrders(); orders.push(order); saveOrders(orders); const message = ['Halo Admin HunianKita,','', 'Saya ingin memesan rumah (Invoice: '+invoice+')','', lines, '', 'Total: '+toRupiah(total),'','Data Pembeli:','Nama: '+name,'Email: '+email,'WhatsApp: '+phone,'Alamat: '+address, note? 'Catatan: '+note : '', '','Terima kasih.'].filter(Boolean).join('\n'); window.open('https://wa.me/'+ADMIN_WA+'?text='+encodeURIComponent(message), '_blank'); clearCart(); renderCartCount(); renderCheckoutSummary(); alert('Pesanan disimpan sementara dan WhatsApp dibuka untuk konfirmasi.'); }

async function generateInvoicePremium(){ const box = qs('#invoicePremium'); if(!box){ alert('Template invoice tidak ditemukan'); return; } const invoice = generateInvoiceId(); qs('#invNumber').innerText = invoice; const name = (qs('[name=name]')||{}).value || ''; const phone = (qs('[name=whatsapp]')||qs('[name=phone]')||{}).value || ''; const address = (qs('[name=address]')||qs('[name=alamat]')||{}).value || ''; let items = loadCart(); const urlItem = getParam('item'); if(items.length===0 && urlItem){ const el=document.querySelector('[data-item-id="'+urlItem+'"]'); if(el) items=[{id:urlItem,name:el.dataset.itemName||urlItem,price:Number(el.dataset.itemPrice||0),qty:1}]; else items=[{id:urlItem,name:urlItem,price:0,qty:1}]; } const rows = qs('#invoiceRows'); if(rows){ rows.innerHTML=''; items.forEach(it=>{ const tr = document.createElement('tr'); tr.innerHTML = '<td style="padding:8px;border:1px solid #eee">'+it.name+'</td><td style="padding:8px;border:1px solid #eee;text-align:center">'+it.qty+'</td><td style="padding:8px;border:1px solid #eee;text-align:right">'+toRupiah(it.price)+'</td><td style="padding:8px;border:1px solid #eee;text-align:right">'+toRupiah(Number(it.price)*(it.qty||1))+'</td>'; rows.appendChild(tr); }); } qs('#pTotal').innerText = toRupiah(items.reduce((s,i)=> s + Number(i.price)*(i.qty||1), 0)); if(qs('#qrCanvas') && window.QRCode){ qs('#qrCanvas').innerHTML=''; new QRCode(qs('#qrCanvas'), { text: 'https://wa.me/'+ADMIN_WA+'?text='+encodeURIComponent('Konfirmasi pembayaran '+invoice), width:140, height:140 }); } box.style.display='block'; if(typeof html2canvas==='undefined' || typeof window.jspdf==='undefined'){ alert('html2canvas/jsPDF belum dimuat'); box.style.display='none'; return; } try{ const canvas = await html2canvas(box, { scale:2, useCORS:true }); const img = canvas.toDataURL('image/png'); const { jsPDF } = window.jspdf; const pdf = new jsPDF('p','mm','a4'); const pageWidth = pdf.internal.pageSize.getWidth(); const imgWidth = pageWidth - 20; const ratio = canvas.height/canvas.width; const imgHeight = imgWidth * ratio; pdf.addImage(img,'PNG',10,10,imgWidth,imgHeight); pdf.save(invoice + '.pdf'); }catch(e){ console.error(e); alert('Gagal menghasilkan PDF'); } finally { box.style.display='none'; } }

async function loadGalleryPreview(containerSelector='#gallery-preview'){ const container = qs(containerSelector); if(!container) return; container.innerHTML = '<div style="opacity:.6">Memuat gallery...</div>'; const apiUrl = `https://api.github.com/repos/${REPO_USER}/${REPO_NAME}/contents/${REPO_IMG_FOLDER}`; try{ const res = await fetch(apiUrl); if(!res.ok) throw new Error('GitHub API error'); const data = await res.json(); const imgs = data.filter(f=>f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)); container.innerHTML = ''; const grid = document.createElement('div'); grid.className = 'preview-grid'; imgs.forEach((f,i)=>{ const w = document.createElement('div'); w.innerHTML = `<img src="${f.download_url}" loading="lazy"><div style="padding:6px;text-align:center;font-size:13px">${f.name}</div>`; grid.appendChild(w); w.querySelector('img').addEventListener('click', ()=> openLightbox(imgs,i)); }); container.appendChild(grid); }catch(e){ container.innerHTML = '<div style="color:#c00">Gagal memuat gallery</div>'; console.error(e); } }

function openLightbox(imgs, idx){ if(!qs('#hk-lightbox')){ const lb = document.createElement('div'); lb.id='hk-lightbox'; lb.style='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);z-index:9999;padding:20px'; lb.innerHTML = `<button id="hk-close" style="position:absolute;right:18px;top:18px;padding:8px 12px;border-radius:8px;background:#fff;border:0;cursor:pointer">Close</button><button id="hk-prev" style="position:absolute;left:18px;top:50%;transform:translateY(-50%);padding:8px;background:#fff;border:0;border-radius:8px;cursor:pointer">◀</button><button id="hk-next" style="position:absolute;right:18px;top:50%;transform:translateY(-50%);padding:8px;background:#fff;border:0;border-radius:8px;cursor:pointer">▶</button><img id="hk-img" src="" style="max-width:92%;max-height:92%;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.6)"/>`; document.body.appendChild(lb); qs('#hk-close').addEventListener('click', ()=> qs('#hk-lightbox').style.display='none'); qs('#hk-next').addEventListener('click', ()=> { window.hkIndex = (window.hkIndex+1) % window.hkImgs.length; qs('#hk-img').src = window.hkImgs[window.hkIndex].download_url }); qs('#hk-prev').addEventListener('click', ()=> { window.hkIndex = (window.hkIndex-1+window.hkImgs.length)%window.hkImgs.length; qs('#hk-img').src = window.hkImgs[window.hkIndex].download_url }); } window.hkImgs = imgs; window.hkIndex = idx; qs('#hk-img').src = imgs[idx].download_url; qs('#hk-lightbox').style.display = 'flex'; }

document.addEventListener('DOMContentLoaded', function(){ renderCartCount(); renderCheckoutSummary(); qsa('.add-cart').forEach(b=> b.addEventListener('click', function(){ addToCart(this.dataset.id||this.getAttribute('data-id'), this.dataset.name||this.getAttribute('data-name')||this.textContent, Number(this.dataset.price||this.getAttribute('data-price')||0)); renderCheckoutSummary(); })); const cf = qs('#checkoutForm'); if(cf) cf.addEventListener('submit', function(e){ e.preventDefault(); checkoutToWhatsApp(this); }); const btnInv = qs('#btnInvoicePremium'); if(btnInv) btnInv.addEventListener('click', function(e){ e.preventDefault(); generateInvoicePremium(); }); if(qs('#gallery-preview')) loadGalleryPreview('#gallery-preview'); });
/* ======================
   HERO SLIDER PREMIUM V4
   ====================== */
let slideIndex = 0;
const slides = document.querySelectorAll(".hero-slider .slide");
const dotsContainer = document.querySelector(".slider-dots");

if (slides.length > 0) {
    slides.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.dataset.index = i;
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll(".slider-dots span");
    dots[0].classList.add("active");

    function showSlide(n) {
        slides.forEach(sl => sl.classList.remove("active"));
        dots.forEach(d => d.classList.remove("active"));

        slides[n].classList.add("active");
        dots[n].classList.add("active");
    }

    function nextSlide() {
        slideIndex = (slideIndex + 1) % slides.length;
        showSlide(slideIndex);
    }

    document.querySelector(".next").onclick = () => {
        nextSlide();
    };

    document.querySelector(".prev").onclick = () => {
        slideIndex = (slideIndex - 1 + slides.length) % slides.length;
        showSlide(slideIndex);
    };

    dots.forEach(dot => {
        dot.onclick = () => {
            slideIndex = parseInt(dot.dataset.index);
            showSlide(slideIndex);
        };
    });

    // Auto play
    setInterval(nextSlide, 5000);
}
