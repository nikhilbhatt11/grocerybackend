import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { Selling } from "../models/selling.model.js";

const createSale = asyncHandler(async (req, res) => {
  const { products, customername, contactNo, totalSaleAmount } = req.body;
  const userId = req.user._id;
  if (!products || products.length === 0) {
    throw new ApiError(400, "Products array cannot be empty");
  }

  if (!customername || !contactNo) {
    throw new ApiError(400, "Customer name, contact number are required");
  }
  if (totalSaleAmount <= 0) {
    throw new ApiError(400, "total sale amount should be greater than 0");
  }
  const soldProducts = [];
  let calculatedTotalSaleAmount = 0;
  for (const item of products) {
    const { productId, quantity, title, price } = item;
    console.log(productId, quantity, title, price);
    if (
      !title ||
      !price ||
      price <= 0 ||
      !productId ||
      !quantity ||
      quantity <= 0
    ) {
      throw new ApiError(
        400,
        "All fileds are required quantity and price should be grater tehna 0"
      );
    }
    const product = await Product.findById(productId);
    console.log(product);
    if (!product) {
      throw new ApiError(404, `Product with ID ${productId} not found`);
    }
    if (product.StockQuantity < quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for product: ${product.title}`
      );
    }
    product.StockQuantity -= quantity;
    await product.save();
    const soldProduct = {
      productId,
      title: product.title,
      quantity,
      price,
      total: price * quantity,
    };
    soldProducts.push(soldProduct);
    calculatedTotalSaleAmount += soldProduct.total;
  }
  const sale = new Selling({
    products: soldProducts,
    customername,
    contactNo,
    totalSaleAmount: calculatedTotalSaleAmount,
    userId,
  });
  await sale.save();
  return res
    .status(200)
    .json(new ApiResponse(202, sale, "Sale created successfully"));
});

const getSaleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
});

const updateSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
});

const deleteSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
});

const getSalesByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const userId = req.user._id;
});

export { createSale };
