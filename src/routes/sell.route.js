import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createSale,
  deleteProductOfSale,
  deleteSale,
  getDateSales,
  getMonthlySales,
  getSaleById,
  getTodaySales,
  updateSale,
} from "../controllers/sellProduct.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/sale").post(createSale);
router.route("/salesofdate").get(getDateSales);
router.route("/todaysales").get(getTodaySales);
router.route("/monthly").get(getMonthlySales);

router.route("/:saleId").get(getSaleById);

router.route("/delete/:saleId").delete(deleteSale);
router.route("/:saleId/:productId").patch(updateSale);
router
  .route("/deletesaledProduct/:saleId/:productId")
  .delete(deleteProductOfSale);

export default router;
