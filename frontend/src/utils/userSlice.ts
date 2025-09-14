import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./store";



export const userSlice = createSlice({
  name: 'user',
  initialState: null,
  reducers: {
    setUser: (state, action) => {
      state = action.payload;
    },
    clearUser: (state) => {
      state = null;
    }
  }
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
export const selectUser = (state: RootState) => state.user;
