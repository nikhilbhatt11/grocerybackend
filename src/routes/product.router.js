import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  searchProduct,
  showInventry,
  updateProduct,
} from "../controllers/product.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/add-product").post(addProduct);
router.route("/search").get(searchProduct);
router.route("/").get(getAllProducts);
router.route("/inventry").get(showInventry);
router.route("/:productId").patch(updateProduct);
router.route("/:productId").delete(deleteProduct);

export default router;
