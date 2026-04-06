import { combineReducers } from 'redux';
import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
  users: userReducer,
});

export default rootReducer;
