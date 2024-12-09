import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createSale } from "../controllers/sellProduct.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/sale").post(createSale);

export default router;
