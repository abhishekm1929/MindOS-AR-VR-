// This script runs on cart.html to display and manage cart items on the dedicated page.
document.addEventListener('DOMContentLoaded', () => {
    console.log('cart-page.js script is running.');

    // Get DOM elements for the cart page
    const cartItemsList = document.getElementById('cart-items-list');
    const cartSubtotalSpan = document.getElementById('cart-subtotal');
    const cartShippingSpan = document.getElementById('cart-shipping');
    const cartTotalPageSpan = document.getElementById('cart-total-page');

    // Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('mindosCart')) || [];
    console.log('Cart loaded from localStorage on cart page:', JSON.stringify(cart));

    // Function to save cart to localStorage (needed for updates on cart page)
    function saveCart() {
        localStorage.setItem('mindosCart', JSON.stringify(cart));
        console.log('Cart saved to localStorage from cart page:', JSON.stringify(cart));
        // Also update the header cart count (main.js handles this, but we can trigger it)
        // If main.js is loaded, its DOMContentLoaded would have already run.
        // We need a way to signal main.js to update its header count.
        // For simplicity, we'll just re-render the cart page.
        updateCartDisplay();
    }

    // Function to remove an item from the cart
    function removeFromCart(productName) {
        console.log('Removing item from cart on cart page:', productName);
        cart = cart.filter(item => item.name !== productName);
        saveCart(); // Save changes
        updateCartDisplay(); // Re-render cart
        showNotification(`${productName.charAt(0).toUpperCase() + productName.slice(1)} removed.`);
    }

    // Function to update the quantity of an item in the cart
    function updateQuantity(productName, change) {
        console.log('Updating quantity for item on cart page:', productName, 'Change:', change);
        const item = cart.find(item => item.name === productName);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(productName);
            } else {
                saveCart(); // Save changes
                updateCartDisplay(); // Re-render cart
            }
        }
    }

    // Function to dynamically render cart items and summary
    function updateCartDisplay() {
        console.log('Updating cart display on cart page. Current cart:', JSON.stringify(cart));
        cartItemsList.innerHTML = ''; // Clear current list
        let subtotal = 0;
        const shippingCost = 5.99; // Example fixed shipping cost

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
            cartSubtotalSpan.innerText = `$0.00`;
            cartShippingSpan.innerText = `$0.00`;
            cartTotalPageSpan.innerText = `$0.00`;
            console.log('Cart is empty on cart page.');
        } else {
            cart.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item-card'); // Use a new class for cart page items
                itemElement.style.animationDelay = `${index * 0.1}s`; // Staggered animation
                itemElement.innerHTML = `
                    <div class="item-details">
                        <img src="${getItemImage(item.name)}" alt="${item.name}" class="item-image">
                        <div class="item-info">
                            <h4>${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</h4>
                            <p class="item-price-single">$${item.price.toFixed(2)} each</p>
                        </div>
                    </div>
                    <div class="item-quantity-controls">
                        <button class="quantity-btn" data-name="${item.name}" data-change="-1">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" data-name="${item.name}" data-change="1">+</button>
                    </div>
                    <span class="item-subtotal">$${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-item-btn" data-name="${item.name}">Remove</button>
                `;
                cartItemsList.appendChild(itemElement);
                subtotal += item.price * item.quantity;
            });

            cartSubtotalSpan.innerText = `$${subtotal.toFixed(2)}`;
            cartShippingSpan.innerText = `$${shippingCost.toFixed(2)}`;
            cartTotalPageSpan.innerText = `$${(subtotal + shippingCost).toFixed(2)}`;
            console.log('Cart items rendered on cart page. Subtotal:', subtotal.toFixed(2));

            // Attach event listeners to new buttons
            cartItemsList.querySelectorAll('.quantity-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const name = event.target.dataset.name;
                    const change = parseInt(event.target.dataset.change);
                    updateQuantity(name, change);
                });
            });

            cartItemsList.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const name = event.target.dataset.name;
                    removeFromCart(name);
                });
            });
        }
    }

    // Helper function to get image path based on product name
    function getItemImage(productName) {
        // This needs to map to your actual image files
        switch (productName) {
            case 'sunglasses': return 'sunglasses.jpg';
            case 'watch': return 'noise-curve-smartwatch--19-2024-03.webp';
            case 'hat': return 'vr-hat.jpg';
            case 'sofa': return 'new-sofa.jpg';
            case 'coffee-table': return 'coffee-t.jpg';
            case 'lamp': return 'lamp.jpg';
            default: return 'https://placehold.co/50x50/cccccc/333333?text=N/A'; // Placeholder for unknown
        }
    }

    // Initial load of cart display when page loads
    updateCartDisplay();

    // Simple Notification/Message Box (for consistency)
    function showNotification(message) {
        let notification = document.getElementById('app-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'app-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #4CAF50; /* Green */
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(notification);
        }
        notification.innerText = message;
        notification.style.opacity = '1';

        setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000); // Hide after 3 seconds
    }
});