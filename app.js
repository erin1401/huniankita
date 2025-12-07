let cart = JSON.parse(localStorage.getItem("cart") || "[]");

document.querySelectorAll(".add-cart")?.forEach(btn => {
    btn.onclick = () => {
        cart.push({ id: btn.dataset.id, price: parseInt(btn.dataset.price) });
        localStorage.setItem("cart", JSON.stringify(cart));
        alert("Ditambahkan ke keranjang!");
    };
});

if (document.getElementById("cart-list")) {
    let total = 0;
    cart.forEach(item => {
        total += item.price;
        document.getElementById("cart-list").innerHTML +=
            `<li>Tipe ${item.id} — Rp ${item.price.toLocaleString()}</li>`;
    });
    document.getElementById("cart-total").innerText = "Rp " + total.toLocaleString();
}

if (document.getElementById("checkoutForm")) {
    document.getElementById("checkoutForm").onsubmit = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        form.append("cart", JSON.stringify(cart));
        const res = await fetch("../backend/sendCheckout.php", { method: "POST", body: form });
        const msg = await res.text();
        alert(msg);
        localStorage.removeItem("cart");
    };
}

async function trackOrder(){
    const id = document.getElementById("trackId").value;
    if(!id) return alert("Masukkan ID pesanan");
    const res = await fetch("../backend/api/track.php?id=" + id);
    const data = await res.json();
    document.getElementById("trackResult").innerHTML = `
        <p>Status: <b>${data.status}</b></p>
        <p>Total: Rp ${data.total.toLocaleString()}</p>`;
}
