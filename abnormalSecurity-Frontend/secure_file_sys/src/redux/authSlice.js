import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    auth: localStorage.getItem("authData") ? JSON.parse(localStorage.getItem("authData")) : null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuth: (state, action) => {
            state.auth = action.payload;
        }
    }
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;