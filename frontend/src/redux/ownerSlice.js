import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");

const ownerSlice = createSlice({
    name: "owner",
    initialState: {
        myShopData: storedUser ? JSON.parse(storedUser) : null,
        city: null,
    },
    reducers: {
        setMyShopData: (state, action) => {
            if (action.payload && action.payload.user) {
                state.myShopData = action.payload.user;
            } else {
                state.myShopData = action.payload;
            }

            localStorage.setItem(
                "user",
                JSON.stringify(state.myShopData)
            );
        },

        setCity: (state, action) => {
            state.city = action.payload;
        },

        logoutUser: (state) => {
            state.myShopData = null;
            state.city = null;
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        },
    },
});

export const { setMyShopData, setCity, logoutUser } = ownerSlice.actions;
export default ownerSlice.reducer;
