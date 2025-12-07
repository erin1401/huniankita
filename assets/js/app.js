
// Simple frontend JS: cart + checkout + basic interactions
document.addEventListener('DOMContentLoaded', function(){
  // mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  if(toggle) toggle.addEventListener('click', function(){ var ul = document.querySelector('.nav-links'); if(ul) ul.style.display = ul.style.display === 'flex' ? 'none' : 'flex'; });

  // lead form
  var lead = document.getElementById('leadForm');
  if(lead) lead.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('lead-name').value || '';
    var phone = document.getElementById('lead-phone').value || '';
    alert('Terima kasih ' + name + '. Tim kami akan menghubungi ' + phone + ' segera.');
    lead.reset();
  });

  // cart stored in localStorage
  var cart = JSON.parse(localStorage.getItem('hz_cart')||'[]');

  function updateCartCount(){
    var count = cart.reduce((s,i)=>s+i.qty,0);
    // update UI (if exists)
  }

  // add to cart buttons
  document.querySelectorAll('.add-cart').forEach(function(btn){
    btn.addEventListener('click', function(){
      var name = btn.dataset.name || btn.getAttribute('data-name');
      var price = parseInt(btn.dataset.price || btn.getAttribute('data-price') || 0);
      var item = cart.find(i=>i.name===name);
      if(item) item.qty++;
      else cart.push({name:name,price:price,qty:1});
      localStorage.setItem('hz_cart', JSON.stringify(cart));
      alert(name + ' ditambahkan ke keranjang.');
      updateCartCount();
    });
  });

  // render checkout summary
  if(document.getElementById('checkout-items')){
    var list = document.getElementById('checkout-items');
    var totalEl = document.getElementById('checkout-total');
    function renderSummary(){
      list.innerHTML = '';
      var total = 0;
      cart.forEach(function(i){
        total += i.price * i.qty;
        var div = document.createElement('div');
        div.textContent = i.name + ' x ' + i.qty + ' — Rp ' + i.price.toLocaleString();
        list.appendChild(div);
      });
      totalEl.textContent = 'Rp ' + total.toLocaleString();
    }
    renderSummary();
  }

  // checkout submit
  var checkoutForm = document.getElementById('checkoutForm');
  if(checkoutForm){
    checkoutForm.addEventListener('submit', async function(e){
      e.preventDefault();
      if(cart.length===0){ alert('Keranjang kosong'); return; }
      var fd = new FormData(checkoutForm);
      fd.append('cart', JSON.stringify(cart));
      try{
        var res = await fetch('../backend/sendCheckout.php', { method:'POST', body: fd });
        var data = await res.json();
        if(data.status){ alert('Pesanan sukses. Invoice: ' + data.order_id); localStorage.removeItem('hz_cart'); cart = []; renderSummary(); }
        else alert('Gagal: ' + (data.message || 'server error'));
      }catch(err){ alert('Gagal mengirim pesanan: ' + err); }
    });
  }

  // tracking
  window.trackOrder = async function(){
    var id = document.getElementById('trackId').value.trim();
    if(!id) return alert('Masukkan ID pesanan');
    try{
      var res = await fetch('api/track.php?id='+encodeURIComponent(id));
      var json = await res.json();
      var out = document.getElementById('trackResult');
      if(json.status) out.innerHTML = '<p>Status: <b>' + json.status + '</b></p><p>Total: Rp ' + (json.total||0).toLocaleString() + '</p>';
      else out.innerHTML = '<p>Tidak ditemukan</p>';
    }catch(e){ alert('Gagal melacak: '+e); }
  };
});
