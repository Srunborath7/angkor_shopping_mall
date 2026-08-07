import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ChevronLeft,
  CreditCard,
  QrCode,
  Truck,
  CheckCircle2,
  ShoppingBag
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeFromCartApi
} from "../services/cartService";
import { checkoutApi, payOrderApi } from "../services/orderService";
import "./CartDrawer.css";

function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth.token;
  const user = auth.user;

  // Multi-step Checkout State: 'cart' | 'info' | 'payment' | 'confirm'
  const [step, setStep] = useState("cart");

  // Cart Items State
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout Form State
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    country: "Cambodia"
  });

  // Payment Method State: 'aba-qr' | 'aba-pay' | 'cod' | 'visa-master'
  const [paymentMethod, setPaymentMethod] = useState("aba-qr");

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || "099888777",
        city: prev.city || "Phnom Penh",
        address: prev.address || "Street 271, Toul Tom Poung"
      }));
    }
  }, [user]);

  // Load cart items initially and listen for updates
  const loadCart = async () => {
    if (isLoggedIn) {
      try {
        const res = await getCartApi();
        const items = res.data?.items || res.items || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(items)) {
          const formatted = items.map((item) => ({
            id: item.id,
            db_id: item.id,
            product_id: item.product_id || item.product?.id,
            name: item.product?.name || "Product",
            price: parseFloat(item.product?.price || 0),
            image: item.product?.image_url || item.product?.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
            quantity: item.quantity
          }));
          setCartItems(formatted);
          localStorage.setItem("cartItems", JSON.stringify(formatted));
          const totalCount = formatted.reduce((acc, i) => acc + i.quantity, 0);
          localStorage.setItem("cartCount", String(totalCount));
          window.dispatchEvent(new Event("cart-updated"));
          return;
        }
      } catch (err) {
        console.warn("API loadCart error, using localStorage fallback:", err);
      }
    }

    const saved = localStorage.getItem("cartItems");
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCart();
      setStep("cart"); // Reset step when opening
    }
  }, [isOpen, isLoggedIn]);

  // Sync to other pages and trigger event
  const saveCartItems = (newItems) => {
    setCartItems(newItems);
    localStorage.setItem("cartItems", JSON.stringify(newItems));
    
    // Calculate total count
    const totalCount = newItems.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", String(totalCount));
    
    // Dispatch events
    window.dispatchEvent(new Event("cart-updated"));
  };

  // Modify Quantities
  const incrementQuantity = async (targetItem) => {
    const newQty = targetItem.quantity + 1;
    const updated = cartItems.map((item) =>
      item.id === targetItem.id ? { ...item, quantity: newQty } : item
    );
    saveCartItems(updated);

    if (isLoggedIn) {
      try {
        if (targetItem.db_id) {
          await updateCartItemApi(targetItem.db_id, newQty);
        } else if (targetItem.product_id || targetItem.id) {
          await addToCartApi(targetItem.product_id || targetItem.id, 1);
        }
      } catch (err) {
        console.warn("Failed to update cart API:", err);
      }
    }
  };

  const decrementQuantity = async (targetItem) => {
    if (targetItem.quantity === 1) {
      removeFromCart(targetItem);
      return;
    }
    const newQty = targetItem.quantity - 1;
    const updated = cartItems.map((item) =>
      item.id === targetItem.id ? { ...item, quantity: newQty } : item
    );
    saveCartItems(updated);

    if (isLoggedIn) {
      try {
        if (targetItem.db_id) {
          await updateCartItemApi(targetItem.db_id, newQty);
        }
      } catch (err) {
        console.warn("Failed to decrement cart API:", err);
      }
    }
  };

  const removeFromCart = async (targetItem) => {
    const targetId = typeof targetItem === 'object' ? targetItem.id : targetItem;
    const itemObj = typeof targetItem === 'object' ? targetItem : cartItems.find((i) => i.id === targetId);
    const updated = cartItems.filter((item) => item.id !== targetId);
    saveCartItems(updated);
    toast.success("Item removed from cart");

    if (isLoggedIn && itemObj?.db_id) {
      try {
        await removeFromCartApi(itemObj.db_id);
      } catch (err) {
        console.warn("Failed to remove item API:", err);
      }
    }
  };

  // Coupon handling
  const applyCoupon = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "ANGKOR30") {
      setDiscount(0.3); // 30% discount
      toast.success("30% promo code applied!");
    } else if (promoCode.trim()) {
      toast.error("Invalid coupon code");
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 4.99 : 0;
  const promoDiscountVal = subtotal * discount;
  const grandTotal = subtotal + shipping - promoDiscountVal;

  // Form input handler
  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Progress steps
  const proceedToInfo = () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to proceed with checkout");
      onClose();
      navigate("/auth/login");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setStep("info");
  };

  const proceedToPayment = () => {
    // Basic Form validation
    if (!form.fullName || !form.email || !form.phone || !form.city || !form.address) {
      toast.error("Please fill in all shipping fields");
      return;
    }
    setStep("payment");
  };

  const proceedToConfirm = () => {
    setStep("confirm");
  };

  // Submit Order via API & local state
  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to place an order");
      onClose();
      navigate("/auth/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sync cart items to API if DB cart is empty
      if (cartItems.length > 0) {
        for (const item of cartItems) {
          const prodId = item.product_id || item.id;
          if (prodId && !item.db_id) {
            try {
              await addToCartApi(prodId, item.quantity);
            } catch (e) {
              console.warn("Sync cart item to DB:", e);
            }
          }
        }
      }

      // 2. Execute Checkout API call
      const fullAddress = `${form.address}, ${form.city}`;
      const res = await checkoutApi({
        shipping_address: fullAddress,
        contact_phone: form.phone
      });

      const orderData = res.data?.order || res.order || res.data;
      const numericId = orderData?.id || Math.floor(1000 + Math.random() * 9000);
      const orderId = `#ORD-${numericId}`;

      // 3. Mark payment processed & send notification callback
      if (orderData?.id) {
        try {
          await payOrderApi(orderData.id, `${paymentMethod.toUpperCase()}-PAYMENT-INTENT`);
        } catch (payErr) {
          console.warn("Pay notification error:", payErr);
        }
      }

      // 4. Update local orders array
      const newOrder = {
        id: orderId,
        rawId: orderData?.id,
        date: new Date().toISOString().split("T")[0],
        items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        total: grandTotal.toFixed(2),
        status: "Paid",
        paymentMethod: paymentMethod.toUpperCase(),
        shippingInfo: form,
        products: cartItems
      };

      const existingOrders = localStorage.getItem("orders");
      const ordersList = existingOrders ? JSON.parse(existingOrders) : [];
      ordersList.unshift(newOrder);
      localStorage.setItem("orders", JSON.stringify(ordersList));

      // Clear Cart
      saveCartItems([]);
      setPromoCode("");
      setDiscount(0);
      setIsSubmitting(false);
      onClose();

      Swal.fire({
        icon: "success",
        title: "Order Placed Successfully!",
        text: `Your Order ID is ${orderId}. Track it under Orders tab.`,
        confirmButtonText: "View My Orders",
        confirmButtonColor: "#4E7D4E"
      }).then(() => {
        navigate("/orders");
      });
    } catch (error) {
      setIsSubmitting(false);
      console.error("Checkout error:", error);
      const errMsg = error.message || error.response?.data?.message || "Failed to place order";
      toast.error(errMsg);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            className="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer container */}
          <motion.div
            className="cart-drawer-container"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
          >
            {/* Header */}
            <div className="cart-drawer-header">
              <div className="header-title-box">
                {step !== "cart" && (
                  <button
                    className="drawer-back-btn"
                    onClick={() => {
                      if (step === "info") setStep("cart");
                      if (step === "payment") setStep("info");
                      if (step === "confirm") setStep("payment");
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h3>
                  {step === "cart" && `Cart (${cartItems.length})`}
                  {step === "info" && "Shipping Details"}
                  {step === "payment" && "Select Payment"}
                  {step === "confirm" && "Order Overview"}
                </h3>
              </div>
              <button className="drawer-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Content Switch */}
            <div className="cart-drawer-body">
              {step === "cart" && (
                <div className="cart-step-content">
                  {cartItems.length === 0 ? (
                    <div className="empty-cart-view">
                      <ShoppingBag size={64} className="empty-cart-icon" />
                      <h4>Your cart is empty</h4>
                      <p>Browse products and add them to your cart to checkout.</p>
                      <button className="empty-continue-btn" onClick={onClose}>
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items List */}
                      <div className="cart-items-list">
                        {cartItems.map((item) => (
                          <div key={item.id} className="cart-item-card">
                            <img src={item.image} alt={item.name} className="cart-item-img" />
                            <div className="cart-item-info">
                              <h4 className="cart-item-name">{item.name}</h4>
                              <span className="cart-item-price">${item.price}</span>
                              <div className="cart-qty-row">
                                <div className="cart-qty-buttons">
                                  <button onClick={() => decrementQuantity(item.id)}>
                                    <Minus size={12} />
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button onClick={() => incrementQuantity(item.id)}>
                                    <Plus size={12} />
                                  </button>
                                </div>
                                <button className="cart-item-delete" onClick={() => removeFromCart(item.id)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Coupon Box */}
                      <form onSubmit={applyCoupon} className="coupon-box-form">
                        <input
                          type="text"
                          placeholder="Promo code (e.g. ANGKOR30)"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                        />
                        <button type="submit">Apply</button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {step === "info" && (
                <div className="info-step-content">
                  <div className="checkout-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Sok Dara"
                      value={form.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. sokdara@example.com"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g. 012345678"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Phnom Penh"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label>Address Details</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="e.g. House 12, St 271, Sangkat Boeung Keng Kang"
                      value={form.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>
                </div>
              )}

              {step === "payment" && (
                <div className="payment-step-content">
                  <h4 className="payment-section-title">Select Payment Method</h4>

                  <div className="payment-options-grid">
                    {/* ABA KHQR */}
                    <div
                      className={`payment-option-card ${paymentMethod === "aba-qr" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("aba-qr")}
                    >
                      <QrCode className="payment-card-icon" />
                      <div className="payment-card-text">
                        <span className="method-title">ABA KHQR</span>
                        <span className="method-sub">Scan QR Code instantly</span>
                      </div>
                    </div>

                    {/* ABA Pay */}
                    <div
                      className={`payment-option-card ${paymentMethod === "aba-pay" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("aba-pay")}
                    >
                      <CreditCard className="payment-card-icon" />
                      <div className="payment-card-text">
                        <span className="method-title">ABA Pay</span>
                        <span className="method-sub">Direct ABA bank routing</span>
                      </div>
                    </div>

                    {/* Visa / Master */}
                    <div
                      className={`payment-option-card ${paymentMethod === "visa-master" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("visa-master")}
                    >
                      <CreditCard className="payment-card-icon" />
                      <div className="payment-card-text">
                        <span className="method-title">Visa / Mastercard</span>
                        <span className="method-sub">Secure Credit/Debit payment</span>
                      </div>
                    </div>

                    {/* COD */}
                    <div
                      className={`payment-option-card ${paymentMethod === "cod" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <Truck className="payment-card-icon" />
                      <div className="payment-card-text">
                        <span className="method-title">Cash on Delivery</span>
                        <span className="method-sub">Pay on physical delivery</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === "confirm" && (
                <div className="confirm-step-content">
                  {/* Shipping info review */}
                  <div className="review-block-card">
                    <h4>Delivery To</h4>
                    <p className="bold">{form.fullName}</p>
                    <p>{form.phone}</p>
                    <p>{form.address}, {form.city}</p>
                  </div>

                  {/* Payment method review */}
                  <div className="review-block-card">
                    <h4>Payment Method</h4>
                    <p className="bold text-green">
                      {paymentMethod === "aba-qr" && "ABA KHQR Scan"}
                      {paymentMethod === "aba-pay" && "ABA Pay App Link"}
                      {paymentMethod === "visa-master" && "Credit / Debit Card"}
                      {paymentMethod === "cod" && "Cash on Delivery"}
                    </p>
                  </div>

                  {/* Products review */}
                  <div className="review-block-card">
                    <h4>Items Checklist ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</h4>
                    <div className="review-items-mini-list">
                      {cartItems.map((item) => (
                        <div key={item.id} className="review-mini-item">
                          <span>{item.name} <span className="text-light">x{item.quantity}</span></span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Calculator / Actions */}
            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="billing-summary-block">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="summary-row text-green">
                      <span>Discount (30%)</span>
                      <span>-${promoDiscountVal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-row total-row">
                    <span>Total Cost</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="footer-action-buttons">
                  {step === "cart" && (
                    <button className="checkout-primary-btn" onClick={proceedToInfo}>
                      Proceed to Checkout
                    </button>
                  )}
                  {step === "info" && (
                    <button className="checkout-primary-btn" onClick={proceedToPayment}>
                      Continue to Payment
                    </button>
                  )}
                  {step === "payment" && (
                    <button className="checkout-primary-btn" onClick={proceedToConfirm}>
                      Review Order Details
                    </button>
                  )}
                  {step === "confirm" && (
                    <button className="checkout-primary-btn confirm-order-btn" onClick={handlePlaceOrder}>
                      <CheckCircle2 size={16} /> Place Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
