import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    shared_files_list: [],
    owner_files_list: []
}

const fileDataSlice = createSlice({
    name: "fileData",
    initialState,
    reducers: {
        setSharedFiles: (state, action) => {
            state.shared_files_list = action.payload.shared_files_list
        },
        setOwnerFiles: (state, action) => {
            state.owner_files_list = action.payload.owner_files_list
        }
    }
});

export const { setSharedFiles, setOwnerFiles } = fileDataSlice.actions;
export default fileDataSlice.reducer;