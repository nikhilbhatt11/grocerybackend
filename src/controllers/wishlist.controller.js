import mongoose, { mongo } from "mongoose";
import { Wishlist } from "../models/wishlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTodo = asyncHandler(async (req, res) => {
  const { subTodos, heading, isTodoListCompleted } = req.body;

  const userId = req.user._id;

  if (!subTodos || subTodos.length === 0) {
    throw new ApiError(400, "SubTodod array cannot be empty");
  }

  if (!heading || !heading.trim()) {
    throw new ApiError(400, "Todo heading is required");
  }
  const subTodosArray = [];
  for (const subtodo of subTodos) {
    if (!subtodo.description.trim()) {
      throw new ApiError(400, "Sub todo description is required");
    }

    const newSubTodo = {
      id: subtodo.id,
      description: subtodo.description,
      isCompleted: subtodo.isCompleted,
    };

    subTodosArray.push(newSubTodo);
  }

  try {
    const todos = new Wishlist({
      subTodos: subTodosArray,
      heading,
      isTodoListCompleted,
      owner: userId,
    });

    await todos.save();
    return res
      .status(200)
      .json(new ApiResponse(202, todos, "todos created successfully"));
  } catch (error) {
    throw new ApiError(400, "Error in creating the todos");
  }
});

const toggleTodoStatus = asyncHandler(async (req, res) => {
  const { todoId, subTodoId } = req.params;

  const todo = await Wishlist.findById(todoId);
  if (!todo) {
    throw new ApiError(400, "todo not found");
  }
  const subTodo = todo.subTodos.find((subTodo) => subTodo.id === subTodoId);

  subTodo.isCompleted = !subTodo.isCompleted;
  const allSubTodosCompleted = todo.subTodos.every(
    (subTodo) => subTodo.isCompleted
  );
  todo.isTodoListCompleted = allSubTodosCompleted;
  await todo.save();
  res
    .status(200)
    .json(new ApiResponse(201, todo, "SubTodo status toggled successfully"));
});

const updateTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;
  const { heading } = req.body;

  const todo = await Wishlist.findByIdAndUpdate(
    todoId,
    { heading },
    { new: true }
  );

  if (!todo) {
    throw new ApiError(404, "Todo of given id not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, todo, "Todo updated successfully"));
});

const updateSubTodod = asyncHandler(async (req, res) => {
  const { todoId, subTodoId } = req.params;
  const { description } = req.body;

  const todo = await Wishlist.findById(todoId);
  if (!todo) {
    throw new ApiError(401, "Todo of given id not found");
  }

  const subTodo = todo.subTodos.find((subtodo) => subtodo.id === subTodoId);
  if (!subTodo) {
    throw new ApiError(404, "SubTodo of given id not found");
  }
  if (description) {
    subTodo.description = description;
  } else {
    throw new ApiError(400, "Description is required");
  }
  await todo.save();

  return res
    .status(200)
    .json(new ApiResponse(202, subTodo, "SubTodo updated successfully"));
});

const deleteTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;

  const deltedTodo = await Wishlist.findByIdAndDelete(todoId);
  if (!deltedTodo) {
    throw new ApiError(402, "Error in deleting the todo");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "todo deleted successfully"));
});

const deleteSubTodo = asyncHandler(async (req, res) => {
  const { todoId, subTodoId } = req.params;

  const todo = await Wishlist.findById(todoId);

  const subTodoIndex = todo.subTodos.findIndex(
    (subtodo) => subtodo.id === subTodoId
  );
  if (subTodoIndex === -1) {
    throw new ApiError(404, "subtodo not found in the list");
  }
  const deletedsubtodo = todo.subTodos.splice(subTodoIndex, 1);

  await todo.save();
  return res
    .status(200)
    .json(new ApiResponse(202, todo, "Sub Todo delted successfully"));
});

const getAllTodo = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  try {
    const allTodos = await Wishlist.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
    ]);
    if (allTodos.length <= 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(202, [], "No Todo is created create a todo first")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(202, allTodos, "All todo fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Server error. Please try again later.");
  }
});

export {
  createTodo,
  toggleTodoStatus,
  getAllTodo,
  deleteSubTodo,
  deleteTodo,
  updateSubTodod,
  updateTodo,
};
