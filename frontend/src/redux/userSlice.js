import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: storedUser ? JSON.parse(storedUser) : null,
        currentCity: null,
        currentState: null,
        currentAddress: null,
        shopInMyCity: null,
        itemsInMyCity: null,
        cartItems: [],
        totalAmount: 0,
        MyOrders: []
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
            localStorage.removeItem("user");
        },

        setItemsInMyCity: (state, action) => {
            state.itemsInMyCity = action.payload;
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
        },

        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.cartItems.find(i => i.id == id);
            if (item) {
                item.quantity = quantity;
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        },

        removeCartItem: (state, action) => {
            state.cartItems = state.cartItems.filter(i => i.id !== action.payload);
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        },

        setMyOrders: (state, action) => {
            state.MyOrders = action.payload
        },

        addMyOrders: (state, action) => {
            state.MyOrders = [action.payload, ...state.MyOrders ]
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
        }
    }
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
    updateOrderStatus
} = userSlice.actions;

export default userSlice.reducer;