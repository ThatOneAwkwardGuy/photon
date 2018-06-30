export const ADD_TASK = 'ADD_TASK';
export const REMOVE_TASK = 'REMOVE_TASK';
export const UPDATE_TASK = 'UPDATE_TASK';

export function addTask(taskClass) {
  return {
    type: ADD_TASK,
    payload: taskClass
  };
}

export function removeTask(task) {
  return {
    type: REMOVE_TASK,
    payload: task
  };
}

export function updateTask({ task, id }) {
  return {
    type: UPDATE_TASK,
    payload: task,
    id: id
  };
}
