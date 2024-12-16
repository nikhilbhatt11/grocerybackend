import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";

const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  if (pageNumber <= 0 || limitNumber <= 0) {
    throw new ApiError(400, "Page and limit must be positive integers.");
  }
  try {
    const allProducts = await Product.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
      {
        $sort: { StockQuantity: 1, _id: 1 },
      },
      { $skip: (pageNumber - 1) * limitNumber },
      { $limit: limitNumber },
      {
        $project: {
          title: 1,
          category: 1,
          StockQuantity: 1,
          unit: 1,
          price: 1,
          discount: 1,
          owner: 1,
        },
      },
    ]);
    if (allProducts.length <= 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            202,
            {},
            "No product is added please add product first"
          )
        );
    }
    const totalProducts = await Product.countDocuments({ owner: userId });
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalProducts,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalProducts / limitNumber),
          allProducts,
        },
        "All products of the user send successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching all products of the user", error);
    throw new ApiError(500, "Server error. Please try again later.");
  }
});

const showInventry = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  if (pageNumber <= 0 || limitNumber <= 0) {
    throw new ApiError(400, "Page and limit must be positive integers.");
  }
  try {
    const products = await Product.aggregate([
      {
        $match: {
          owner: userId,
          StockQuantity: { $gt: 0 },
        },
      },
      {
        $sort: { StockQuantity: 1, _id: 1 },
      },
      { $skip: (pageNumber - 1) * limitNumber },
      { $limit: limitNumber },
      {
        $project: {
          title: 1,
          category: 1,
          StockQuantity: 1,
          unit: 1,
          price: 1,
          discount: 1,
          owner: 1,
        },
      },
    ]);
    if (products.length <= 0) {
      return res
        .status(200)
        .json(new ApiResponse(202, {}, "The inventry is empty"));
    }
    const totalProducts = await Product.countDocuments({
      owner: userId,
      StockQuantity: { $gt: 0 },
    });
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalProducts,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalProducts / limitNumber),
          products,
        },
        "All products of the user send successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching Invertry of the user", error);
    throw new ApiError(500, "Server error. Please try again later.");
  }
});

const addProduct = asyncHandler(async (req, res) => {
  const { title, category, StockQuantity, price, discount, unit } = req.body;
  const userId = req.user._id;
  if ([title, category].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "title and category are required");
  }
  if (StockQuantity <= 0 || price <= 0) {
    throw new ApiError(400, "Stock Qty and Price should be greater than 0");
  }
  if (discount < 0) {
    throw new ApiError(400, "Discount should not be less than 0");
  }

  try {
    const product = await Product.create({
      title,
      category,
      StockQuantity,
      price,
      discount,
      unit,
      owner: userId,
    });
    const productWithOwner = await Product.aggregate([
      {
        $match: {
          _id: product._id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      {
        $unwind: "$ownerDetails",
      },
      {
        $project: {
          title: 1,
          category: 1,
          StockQuantity: 1,
          price: 1,
          discount: 1,
          unit: 1,
          owner: {
            shopname: "$ownerDetails.shopname",
          },
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(201, productWithOwner, "Product added successfully")
      );
  } catch (error) {
    console.error("Error adding product:", error);
    throw new ApiError(500, "Something went wroung while adding the product");
  }
});

const searchProduct = asyncHandler(async (req, res) => {
  const { title } = req.query;
  const userId = req.user._id;
  if (!title || title.trim() === "") {
    throw new ApiError(400, "product title is required");
  }

  try {
    const products = await Product.find({
      title: { $regex: title, $options: "i" },
      owner: userId,
    });

    if (products.length === 0) {
      throw new ApiError(400, "No products found matching the title.");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          202,
          products,
          "All products matched to this title for this user"
        )
      );
  } catch (error) {
    console.error("Error searching products:", error);
    throw new ApiError(500, "Server error. Please try again later.");
  }
});
const getProductById = async (req, res, next) => {
  const { productId } = req.params;

  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      throw new ApiError(400, "Invalid product ID format.");
    }
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(201, product, "products details fetched successfully")
      );
  } catch (error) {
    next(error);
  }
};

const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { title, category, StockQuantity, price, discount, unit } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(400, "Product not found");
  }
  if ([title, category].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }

  if (StockQuantity < 0 || price < 0 || discount < 0 || discount > 100) {
    throw new ApiError(400, "Invalid numeric values provided");
  }

  product.title = title || product.title;
  product.category = category || product.category;
  product.StockQuantity =
    StockQuantity != null
      ? product.StockQuantity + StockQuantity
      : product.StockQuantity;
  product.price = price ?? product.price;
  product.discount = discount ?? product.discount;
  product.unit = unit || product.unit;
  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(202, product, "product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Product not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product deleted successfully"));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

export {
  getAllProducts,
  addProduct,
  searchProduct,
  updateProduct,
  deleteProduct,
  showInventry,
  getProductById,
};
