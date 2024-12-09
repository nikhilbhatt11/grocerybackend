import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addProduct,
  getAllProducts,
  searchProduct,
} from "../controllers/product.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/add-product").post(addProduct);
router.route("/search").get(searchProduct);
router.route("/").get(getAllProducts);

export default router;
