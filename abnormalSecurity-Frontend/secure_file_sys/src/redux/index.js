import { configureStore } from "@reduxjs/toolkit";
import fileDataSlice from "./fileDataSlice.js";
import authSlice from "./authSlice.js";
import accessUsers from "./accessUsers.js";

const store = configureStore({
    reducer: {
        fileData: fileDataSlice,
        auth: authSlice,
        accessUsers: accessUsers
    }
});

export default store;