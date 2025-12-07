
document.addEventListener('DOMContentLoaded', function(){
  var lead = document.getElementById('leadForm');
  if(lead) lead.addEventListener('submit', function(e){
    e.preventDefault();
    alert('Terima kasih! Tim kami akan menghubungi Anda dalam 1x24 jam.');
    lead.reset();
  });

  document.querySelectorAll('.add-cart').forEach(function(btn){
    btn.addEventListener('click', function(){
      var name = this.dataset.name;
      var price = this.dataset.price;
      var cart = JSON.parse(localStorage.getItem('hz_cart')||'[]');
      var item = cart.find(i=>i.name===name);
      if(item) item.qty++; else cart.push({name:name,price:parseInt(price),qty:1});
      localStorage.setItem('hz_cart', JSON.stringify(cart));
      alert(name + ' ditambahkan ke keranjang.');
    });
  });

  var summary = document.getElementById('checkout-items');
  if(summary){
    var cart = JSON.parse(localStorage.getItem('hz_cart')||'[]');
    var total = 0;
    cart.forEach(function(i){ total += i.price * i.qty; var div=document.createElement('div'); div.textContent = i.name + ' x'+i.qty + ' — Rp ' + i.price.toLocaleString(); summary.appendChild(div); });
    var totel = document.getElementById('checkout-total'); if(totel) totel.textContent = 'Rp ' + total.toLocaleString();
  }
});
