import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axios';

// ─── Async Thunks ─────────────────────────────────────────────────────────
export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/api/user');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createUser = createAsyncThunk('users/create', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/api/user', data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/api/user/${id}`, data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/user/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────
const userSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // createUser
    builder
      .addCase(createUser.fulfilled, (state, action) => { state.list.push(action.payload); });

    // updateUser
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      });

    // deleteUser
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u._id !== action.payload);
      });
  },
});

export default userSlice.reducer;
