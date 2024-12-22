import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    accessUsers: []
}

const accessUsersSlice = createSlice({
    name: "accessUsers",
    initialState,
    reducers: {
        setAccessUsers: (state, action) => {
            state.accessUsers = action.payload;
        }
    }
});

export const { setAccessUsers } = accessUsersSlice.actions;
export default accessUsersSlice.reducer;