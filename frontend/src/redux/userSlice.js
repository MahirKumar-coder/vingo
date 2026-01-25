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
        itemsInMyCity: null
    },
    reducers: {
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
            localStorage.removeItem("user");
        },

        setItemsInMyCity: (state, action) => {
            state.itemsInMyCity = action.payload;
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
    setItemsInMyCity
} = userSlice.actions;

export default userSlice.reducer;
