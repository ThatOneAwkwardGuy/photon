import { ADD_TASK, REMOVE_TASK, UPDATE_TASK, REMOVE_ALL_TASKS } from '../actions/task';
import { stat } from 'fs';

const initialState = { tasks: [] };

export default function taskReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TASK:
      return {
        ...state,
        tasks: state.tasks.concat(action.payload)
      };
    case REMOVE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(item => item !== action.payload)
      };
    case UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task => (state.tasks.indexOf(task) === action.id ? action.payload : task))
      };
    case REMOVE_ALL_TASKS:
      return {
        ...state,
        tasks: []
      };
    default:
      return state;
  }
}
