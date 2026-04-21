async function changeQty(productId, action) {
    try {
      const response = await fetch(`/products/cart/${action}/${productId}`, {
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    }
});

        const data = await response.json();

        
        if (data.removed) {

            
            const row = document.getElementById(`row-${productId}`);
            if (row) {
                row.remove();
            }

           
            const qtyElement = document.getElementById(`qty-${productId}`);
            if (qtyElement) {
                const parent = qtyElement.closest('.btn-group');
                if (parent) {
                    parent.outerHTML = `
                        <button onclick="addToCart('${productId}')" 
                                class="btn btn-sm btn-outline-success"
                                id="cart-btn-${productId}">
                            Add to Cart
                        </button>
                    `;
                }
            }


            const totalElement = document.getElementById("total-price");
            if (totalElement) {
                totalElement.innerText = data.totalPrice.toFixed(2);
            }

            
            const rows = document.querySelectorAll("tbody tr");
            if (rows.length === 0) {
                location.reload();
            }

            return;
        }

        

        if (data.success) {

            const qtyElement = document.getElementById(`qty-${productId}`);
            if (qtyElement) {
                qtyElement.innerText = data.newQty;
            }

          
            const subtotalElement = document.getElementById(`subtotal-${productId}`);
            if (subtotalElement) {
                subtotalElement.innerText = Number(data.itemSubtotal).toFixed(1);
            }

           
            const totalElement = document.getElementById("total-price");
            if (totalElement) {
                totalElement.innerText = data.totalPrice.toFixed(2);
            }
            const countElement = document.getElementById("cart-count");
if (countElement && data.cartCount !== undefined) {
    countElement.innerText = data.cartCount;
}
        }

        else if (data.message) {
            alert(data.message);
        }

    } catch (err) {
        console.error("Cart update failed", err);
    }
}
async function addToCart(productId) {
    try {
        const res = await fetch(`/products/cart/${productId}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        const data = await res.json(); 

        
        const btn = document.getElementById(`cart-btn-${productId}`);

btn.outerHTML = `
<div class="cart-action-wrapper d-flex flex-column gap-2">
  
  <div class="qty-group-container d-flex align-items-center justify-content-between">
    
    <button type="button"
            onclick="changeQty('${productId}', 'decreasing')"
            class="qty-btn-custom">
      -
    </button>

    <div id="qty-${productId}" class="qty-display">1</div>

    <button type="button"
            onclick="changeQty('${productId}', 'increasing')"
            class="qty-btn-custom">
      +
    </button>

  </div>

</div>
`;

        // ✅ UPDATE CART COUNT
        const countElement = document.getElementById("cart-count");
        if (countElement && data.cartCount !== undefined) {
            countElement.innerText = data.cartCount;
        }

    } catch (err) {
        console.log(err);
        alert("Error adding to cart");
    }
}

(() => {
  'use strict'
  const forms = document.querySelectorAll('.needs-validation')
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      form.classList.add('was-validated')
    }, false)
  })
})()
