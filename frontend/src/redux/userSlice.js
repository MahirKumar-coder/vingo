import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedCart = localStorage.getItem("cartItems");

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: storedUser ? JSON.parse(storedUser) : null,
        currentCity: null,
        currentState: null,
        currentAddress: null,
        shopInMyCity: null,
        itemsInMyCity: null,
        cartItems: storedCart ? JSON.parse(storedCart) : [],
        totalAmount: storedCart ? JSON.parse(storedCart).reduce((sum, i) => sum + (i.price * i.quantity || 0), 0) : 0,
        MyOrders: [],
        searchItems: null,
        socket: null
    },
    reducers: {
        // ... (Baaki saare reducers same rahenge) ...

        setUserData: (state, action) => {
            if (action.payload && action.payload.user) {
                state.userData = action.payload.user;
            } else {
                state.userData = action.payload;
            }
            localStorage.setItem("user", JSON.stringify(state.userData));
        },

        setCurrentCity: (state, action) => {
            state.currentCity = action.payload;
        },

        setCurrentState: (state, action) => {
            state.currentState = action.payload;
        },

        setCurrentAddress: (state, action) => {
            state.currentAddress = action.payload;
        },

        setShopInMyCity: (state, action) => {
            state.shopInMyCity = action.payload;
        },

        logoutUser: (state) => {
            state.userData = null;
            state.currentCity = null;
            state.currentState = null;
            state.currentAddress = null;
            state.MyOrders = []; // Logout hone par orders bhi clear kar do
            state.cartItems = []; // Clear cart on logout
            state.totalAmount = 0;
            localStorage.removeItem("user");
            localStorage.removeItem("cartItems"); // Clear cart from localStorage
        },

        setItemsInMyCity: (state, action) => {
            state.itemsInMyCity = action.payload;
        },

        setSocket: (state, action) => {
            state.socket = action.payload;
        },

        addToCart: (state, action) => {
            const cartItem = action.payload;
            const existingItem = state.cartItems.find(i => i.id == cartItem.id);
            if (existingItem) {
                existingItem.quantity += cartItem.quantity;
            } else {
                state.cartItems.push(cartItem);
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            // 💾 Persist cart to localStorage
            localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
        },

        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.cartItems.find(i => i.id == id);
            if (item) {
                item.quantity = quantity;
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            // 💾 Persist cart to localStorage
            localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
        },

        removeCartItem: (state, action) => {
            state.cartItems = state.cartItems.filter(i => i.id !== action.payload);
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            // 💾 Persist cart to localStorage
            localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
        },

        setMyOrders: (state, action) => {
            state.MyOrders = action.payload
        },

        addMyOrders: (state, action) => {
            state.MyOrders = [action.payload, ...state.MyOrders]
        },

        // 👇 FIXED REDUCER IS HERE
        updateOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload;

            // 1. Main Order dhundo
            const order = state.MyOrders.find(o => o._id === orderId);

            if (order && order.shopOrders) {
                // 2. Us Order ke andar 'shopOrders' Array me se sahi Shop dhundo
                const subOrder = order.shopOrders.find(so => {
                    const currentShopId = so.shop._id || so.shop;
                    return String(currentShopId) === String(shopId);
                });

                // 3. Agar mil gaya, to uska status update karo
                if (subOrder) {
                    subOrder.status = status; // ✅ Correct assignment
                }
            }
        },

        // 👇 Yeh dono reducers reducers block ke andar hone chahiye
        updateRealtimeOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload;

            // 1. Main Order dhundo
            const order = state.MyOrders.find(o => o._id === orderId);

            if (order && order.shopOrders) {
                const shopOrder = order.shopOrders.find(so => so.shop._id == shopId);
                if (shopOrder) {
                    shopOrder.status = status;
                }
            }
        }, // <--- Yahan comma (,) lagana zaroori hai

        // 👇 FIX: Isko reducers { } block ke andar laya gaya hai
        setSearchItems: (state, action) => {
            state.searchItems = action.payload;
        },

        clearCart: (state) => {
            state.cartItems = [];
            state.totalAmount = 0;
            localStorage.removeItem("cartItems");
        }

    } // <--- Reducers block yahan close hoga
});

export const {
    setUserData,
    setCurrentCity,
    setCurrentState,
    setCurrentAddress,
    logoutUser,
    setShopInMyCity,
    setItemsInMyCity,
    addToCart,
    updateQuantity,
    removeCartItem,
    setMyOrders,
    addMyOrders,
    updateOrderStatus,
    setSearchItems,
    setSocket,
    updateRealtimeOrderStatus,
    clearCart
} = userSlice.actions;

export default userSlice.reducer;