import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createSale = asyncHandler(async (req, res) => {
  const { products, customername, contactNo, totalSaleAmount } = req.body;
  const userId = req.user._id;
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
