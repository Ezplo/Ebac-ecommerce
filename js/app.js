// ======================================================
// TIENDA ADIDAS - Funcionalidades e interacción con el DOM
// ======================================================

// Elementos del carrito
const cartButton = document.getElementById("open-cart");
const closeCartButton = document.getElementById("close-cart");
const cartPanel = document.getElementById("cart-panel");
const overlay = document.getElementById("drawer-overlay");
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const clearCartButton = document.getElementById("clear-cart");
const checkoutButton = document.getElementById("checkout-button");

// Elementos del catálogo
const productCards = [...document.querySelectorAll(".product-card")];
const searchInput = document.getElementById("product-search");
const categoryFilter = document.getElementById("category-filter");
const sortSelect = document.getElementById("sort-products");
const favoritesButton = document.getElementById("show-favorites");
const favoritesCount = document.getElementById("favorites-count");
const resultsMessage = document.getElementById("catalog-results");
const toast = document.getElementById("store-toast");

// Lectura segura de datos guardados en localStorage
function readStorage(key, defaultValue) {
    try {
        const savedData = JSON.parse(localStorage.getItem(key));
        return savedData ?? defaultValue;
    } catch (error) {
        console.warn(`No se pudieron recuperar los datos de ${key}.`, error);
        return defaultValue;
    }
}

// Construye un catálogo a partir de las tarjetas del HTML
const products = productCards.map((card, index) => {
    const title = card.querySelector(".product-card__title").textContent.trim();
    const image = card.querySelector(".product-card__image").getAttribute("src");
    const category = card.querySelector(".product-card__category").textContent.trim();

    return {
        id: card.dataset.productId || `product-${index + 1}`,
        name: title,
        price: Number(card.querySelector(".product-card__price").textContent.replace(/[^0-9]/g, "")),
        image,
        category: category.toLocaleLowerCase("es-MX"),
        card
    };
});

// Se conservan los carritos anteriores y se adaptan a los nuevos identificadores.
let cart = readStorage("adidasCart", []);
if (!Array.isArray(cart)) cart = [];

cart = cart.map((item) => {
    const matchingProduct = products.find((product) =>
        product.name === item.name && product.image === item.image
    );

    return matchingProduct
        ? {
            id: matchingProduct.id,
            name: matchingProduct.name,
            price: matchingProduct.price,
            image: matchingProduct.image,
            quantity: Math.max(1, Number(item.quantity) || 1)
        }
        : item;
}).filter((item) => item && item.id && Number(item.price) >= 0);

let favorites = readStorage("adidasFavorites", []);
if (!Array.isArray(favorites)) favorites = [];
favorites = favorites.filter((id) => products.some((product) => product.id === id));

let showingFavorites = false;
let toastTimeout;

// Funciones generales
function formatPrice(price) {
    return price.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 2600);
}

function saveCart() {
    localStorage.setItem("adidasCart", JSON.stringify(cart));
}

function saveFavorites() {
    localStorage.setItem("adidasFavorites", JSON.stringify(favorites));
}

// Apertura y cierre del carrito
function openCart() {
    cartPanel.classList.add("is-open");
    overlay.classList.add("is-visible");
    cartPanel.setAttribute("aria-hidden", "false");
    cartButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-is-open");
}

function closeCart() {
    cartPanel.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    cartPanel.setAttribute("aria-hidden", "true");
    cartButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-is-open");
}

cartButton.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
});

// Agregar productos al carrito
function addToCart(productId) {
    const selectedProduct = products.find((product) => product.id === productId);
    if (!selectedProduct) return;

    const existingProduct = cart.find((item) => item.id === productId);

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            image: selectedProduct.image,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    showToast(`${selectedProduct.name} se agregó al carrito.`);
}

// Los botones de cada tarjeta usan el mismo evento.
productCards.forEach((card) => {
    const product = products.find((item) => item.card === card);
    const addButton = card.querySelector(".button");

    addButton.addEventListener("click", () => {
        addToCart(product.id);
        addButton.textContent = "¡Agregado!";
        setTimeout(() => {
            addButton.textContent = "Agregar al carrito";
        }, 900);
    });

    // Botón de favoritos
    const favoriteButton = document.createElement("button");
    favoriteButton.className = "product-card__favorite";
    favoriteButton.type = "button";
    favoriteButton.setAttribute("aria-label", `Agregar ${product.name} a favoritos`);
    favoriteButton.innerHTML = "♡";
    card.appendChild(favoriteButton);

    favoriteButton.addEventListener("click", () => toggleFavorite(product.id));
});

// Dibuja el contenido del carrito y actualiza cantidades y total
function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cart-empty";
        emptyMessage.textContent = "Tu carrito está vacío.";
        cartItemsContainer.appendChild(emptyMessage);
    }

    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach((product) => {
        totalItems += product.quantity;
        totalPrice += product.price * product.quantity;

        const item = document.createElement("article");
        item.className = "cart-item";

        const image = document.createElement("img");
        image.className = "cart-item__image";
        image.src = product.image;
        image.alt = product.name;

        const info = document.createElement("div");
        info.className = "cart-item__info";

        const name = document.createElement("p");
        name.className = "cart-item__name";
        name.textContent = product.name;

        const price = document.createElement("p");
        price.className = "cart-item__price";
        price.textContent = formatPrice(product.price);

        const quantity = document.createElement("div");
        quantity.className = "cart-item__quantity";

        const decreaseButton = document.createElement("button");
        decreaseButton.className = "quantity-button";
        decreaseButton.type = "button";
        decreaseButton.textContent = "−";
        decreaseButton.setAttribute("aria-label", `Disminuir ${product.name}`);

        const quantityText = document.createElement("span");
        quantityText.textContent = product.quantity;

        const increaseButton = document.createElement("button");
        increaseButton.className = "quantity-button";
        increaseButton.type = "button";
        increaseButton.textContent = "+";
        increaseButton.setAttribute("aria-label", `Aumentar ${product.name}`);

        decreaseButton.addEventListener("click", () => changeQuantity(product.id, -1));
        increaseButton.addEventListener("click", () => changeQuantity(product.id, 1));

        quantity.append(decreaseButton, quantityText, increaseButton);
        info.append(name, price, quantity);

        const removeButton = document.createElement("button");
        removeButton.className = "cart-item__remove";
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", `Eliminar ${product.name}`);
        removeButton.addEventListener("click", () => removeProduct(product.id));

        item.append(image, info, removeButton);
        cartItemsContainer.appendChild(item);
    });

    cartCount.textContent = totalItems;
    cartCount.classList.toggle("is-empty", totalItems === 0);
    cartTotal.textContent = formatPrice(totalPrice);
    clearCartButton.disabled = cart.length === 0;
    checkoutButton.disabled = cart.length === 0;
}

// Cambiar cantidad de un producto
function changeQuantity(productId, amount) {
    const product = cart.find((item) => item.id === productId);
    if (!product) return;

    product.quantity += amount;

    if (product.quantity <= 0) {
        removeProduct(productId);
        return;
    }

    saveCart();
    renderCart();
}

// Eliminar un producto
function removeProduct(productId) {
    const removedProduct = cart.find((item) => item.id === productId);
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    renderCart();

    if (removedProduct) showToast(`${removedProduct.name} se eliminó del carrito.`);
}

// Vaciar carrito completo
clearCartButton.addEventListener("click", () => {
    if (cart.length === 0) return;

    cart = [];
    saveCart();
    renderCart();
    showToast("Tu carrito se ha vaciado.");
});

// Simulación de compra: no procesa pagos reales
checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Agrega al menos un producto antes de continuar.");
        return;
    }

    const total = cart.reduce((sum, product) => sum + product.price * product.quantity, 0);
    showToast(`¡Pedido de demostración! Total: ${formatPrice(total)}. No se realizó ningún cobro.`);
});

// Favoritos: agregar o quitar productos
function toggleFavorite(productId) {
    if (favorites.includes(productId)) {
        favorites = favorites.filter((id) => id !== productId);
        showToast("Producto eliminado de favoritos.");
    } else {
        favorites.push(productId);
        showToast("Producto guardado en favoritos.");
    }

    saveFavorites();
    renderFavorites();
    if (showingFavorites) filterProducts();
}

function renderFavorites() {
    favoritesCount.textContent = favorites.length;

    products.forEach((product) => {
        const button = product.card.querySelector(".product-card__favorite");
        const isFavorite = favorites.includes(product.id);

        button.classList.toggle("is-favorite", isFavorite);
        button.textContent = isFavorite ? "♥" : "♡";
        button.setAttribute(
            "aria-label",
            `${isFavorite ? "Quitar" : "Agregar"} ${product.name} ${isFavorite ? "de" : "a"} favoritos`
        );
        button.setAttribute("aria-pressed", String(isFavorite));
    });

    favoritesButton.classList.toggle("is-active", showingFavorites);
    favoritesButton.setAttribute("aria-pressed", String(showingFavorites));
}

// Buscar, filtrar y ordenar productos
function filterProducts() {
    const searchTerm = searchInput.value.trim().toLocaleLowerCase("es-MX");
    const selectedCategory = categoryFilter.value;
    const sortMode = sortSelect.value;

    let visibleProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLocaleLowerCase("es-MX").includes(searchTerm) ||
            product.category.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" || product.category === selectedCategory;

        const matchesFavorites =
            !showingFavorites || favorites.includes(product.id);

        return matchesSearch && matchesCategory && matchesFavorites;
    });

    if (sortMode === "price-asc") {
        visibleProducts.sort((a, b) => a.price - b.price);
    } else if (sortMode === "price-desc") {
        visibleProducts.sort((a, b) => b.price - a.price);
    } else if (sortMode === "name") {
        visibleProducts.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }

    // Oculta las tarjetas que no coinciden con los filtros
    products.forEach((product) => {
        product.card.hidden = !visibleProducts.includes(product);
    });

    // Reordena las tarjetas visibles en el DOM
    visibleProducts.forEach((product) => {
        product.card.parentElement.appendChild(product.card);
    });

    resultsMessage.textContent = visibleProducts.length === 1
        ? "Se encontró 1 producto."
        : `Se encontraron ${visibleProducts.length} productos.`;
}

searchInput.addEventListener("input", filterProducts);
categoryFilter.addEventListener("change", filterProducts);
sortSelect.addEventListener("change", filterProducts);

favoritesButton.addEventListener("click", () => {
    showingFavorites = !showingFavorites;
    renderFavorites();
    filterProducts();
});

// Inicialización
saveCart();
renderCart();
renderFavorites();
filterProducts();

// Navbar: se oculta al bajar y aparece al subir
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
