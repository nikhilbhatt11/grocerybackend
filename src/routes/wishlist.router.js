import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTodo,
  deleteSubTodo,
  deleteTodo,
  getAllTodo,
  toggleTodoStatus,
  updateSubTodod,
  updateTodo,
} from "../controllers/wishlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/add-todo").post(createTodo);
router.route("/all-todos").get(getAllTodo);
router.route("/updatetodo/:todoId").patch(updateTodo);
router.route("/updateSubTodo/:todoId/:subTodoId").patch(updateSubTodod);
router.route("/:todoId/:subTodoId").patch(toggleTodoStatus);
router.route("/deletesubtodo/:todoId/:subTodoId").delete(deleteSubTodo);
router.route("/deleteTodo/:todoId").delete(deleteTodo);

export default router;
