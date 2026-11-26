// Elementos principales de la página
const cartButton = document.getElementById("open-cart");
const closeCartButton = document.getElementById("close-cart");
const cartPanel = document.getElementById("cart-panel");
const overlay = document.getElementById("drawer-overlay");
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const clearCartButton = document.getElementById("clear-cart");

// Recupera el carrito guardado; si no existe, comienza como un array vacío.
let cart = JSON.parse(localStorage.getItem("adidasCart")) || [];

function openDrawer(drawer) {
    closeDrawers();
    drawer.classList.add("is-open");
    overlay.classList.add("is-visible");
    drawer.setAttribute("aria-hidden", "false");
    if (drawer === cartPanel) cartButton.setAttribute("aria-expanded", "true");
}

function closeDrawers() {
    cartPanel.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    cartPanel.setAttribute("aria-hidden", "true");
    cartButton.setAttribute("aria-expanded", "false");
}

cartButton.addEventListener("click", () => openDrawer(cartPanel));
closeCartButton.addEventListener("click", closeDrawers);
overlay.addEventListener("click", closeDrawers);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawers();
});

// Agrega el producto seleccionado o aumenta su cantidad si ya existe.
document.querySelectorAll(".product-card").forEach((card) => {
    const button = card.querySelector(".button");
    button.addEventListener("click", () => {
        const product = {
            id: card.querySelector(".product-card__title").textContent.trim() + "-" + card.querySelector(".product-card__image").getAttribute("src"),
            name: card.querySelector(".product-card__title").textContent.trim(),
            price: Number(card.querySelector(".product-card__price").textContent.replace(/[^0-9]/g, "")),
            image: card.querySelector(".product-card__image").getAttribute("src")
        };

        const existingProduct = cart.find((item) => item.id === product.id);
        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        saveCart();
        renderCart();
        button.textContent = "¡Agregado!";
        setTimeout(() => button.textContent = "Agregar al carrito", 900);
    });
});

function saveCart() {
    localStorage.setItem("adidasCart", JSON.stringify(cart));
}

function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
    }

    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach((product) => {
        totalItems += product.quantity;
        totalPrice += product.price * product.quantity;

        const item = document.createElement("article");
        item.classList.add("cart-item");
        item.innerHTML = `
            <img class="cart-item__image" src="${product.image}" alt="${product.name}">
            <div class="cart-item__info">
                <p class="cart-item__name">${product.name}</p>
                <p class="cart-item__price">$${product.price.toLocaleString("es-MX")}</p>
                <div class="cart-item__quantity">
                    <button type="button" class="quantity-button" data-action="decrease" aria-label="Disminuir cantidad">−</button>
                    <span>${product.quantity}</span>
                    <button type="button" class="quantity-button" data-action="increase" aria-label="Aumentar cantidad">+</button>
                </div>
            </div>
            <button class="cart-item__remove" type="button" aria-label="Eliminar ${product.name}">×</button>
        `;

        item.querySelector('[data-action="decrease"]').addEventListener("click", () => changeQuantity(product.id, -1));
        item.querySelector('[data-action="increase"]').addEventListener("click", () => changeQuantity(product.id, 1));
        item.querySelector(".cart-item__remove").addEventListener("click", () => removeProduct(product.id));
        cartItemsContainer.appendChild(item);
    });

    cartCount.textContent = totalItems;
    cartCount.classList.toggle("is-empty", totalItems === 0);
    cartTotal.textContent = "$" + totalPrice.toLocaleString("es-MX");
    clearCartButton.disabled = cart.length === 0;
}

function changeQuantity(productId, amount) {
    const product = cart.find((item) => item.id === productId);
    if (!product) return;
    product.quantity += amount;
    if (product.quantity <= 0) removeProduct(productId);
    else {
        saveCart();
        renderCart();
    }
}

function removeProduct(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    renderCart();
}

clearCartButton.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
});

// Muestra los productos guardados al cargar la página.
renderCart();

// Oculta la barra al bajar y la muestra al subir.
const siteHeader = document.querySelector(".site-header");
let lastScrollPosition = window.scrollY;

window.addEventListener("scroll", () => {
    const currentScrollPosition = window.scrollY;
    const drawerIsOpen = cartPanel.classList.contains("is-open");

    if (drawerIsOpen) {
        siteHeader.classList.remove("is-hidden");
        lastScrollPosition = currentScrollPosition;
        return;
    }

    if (currentScrollPosition <= 80 || currentScrollPosition < lastScrollPosition - 5) {
        siteHeader.classList.remove("is-hidden");
    } else if (currentScrollPosition > lastScrollPosition + 5) {
        siteHeader.classList.add("is-hidden");
    }

    lastScrollPosition = currentScrollPosition;
}, { passive: true });
