import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { Selling } from "../models/selling.model.js";

const createSale = asyncHandler(async (req, res) => {
  const {
    products,
    customername,
    contactNo,
    totalSaleAmount,
    date,
    paymentMethod,
  } = req.body;
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
    owner: userId,
    date: date,
    payment: paymentMethod,
  });
  await sale.save();
  return res
    .status(200)
    .json(new ApiResponse(202, sale, "Sale created successfully"));
});

const getSaleById = asyncHandler(async (req, res) => {
  const { saleId } = req.params;

  const sale = await Selling.findById(saleId);
  if (!sale) {
    throw new ApiError(400, "Error in finding with this id");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, sale, "This is your matched sale by provided id")
    );
});

const updateSale = asyncHandler(async (req, res) => {
  const { saleId, productId } = req.params;
  const { quantity } = req.body;

  try {
    const sale = await Selling.findById(saleId);
    if (!sale) {
      throw new ApiError("No sale found with this id check saleId again");
    }

    const saledProducts = sale.products;

    const productIndex = saledProducts.findIndex(
      (product) => product.productId == productId
    );
    if (productIndex === -1) {
      throw new ApiError(403, "error in finding the product in the sale");
    }
    if (!quantity || quantity <= 0) {
      throw new ApiError(400, "Quantity should be greater than 0.");
    }
    const productToUpdate = saledProducts[productIndex];

    productToUpdate.quantity = quantity;
    productToUpdate.total = quantity * productToUpdate.price;

    saledProducts[productIndex] = productToUpdate;
    sale.totalSaleAmount = saledProducts.reduce(
      (sum, product) => sum + product.total,
      0
    );

    await sale.save();

    return res
      .status(200)
      .json(new ApiResponse(201, sale, "Sale updated successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Error in updating the sale");
  }
});

const deleteSale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;

  try {
    const deleteSale = await Selling.findById(saleId);

    if (!deleteSale) {
      throw new ApiError(
        400,
        "The sale with given id is not found or already deletd"
      );
    }
    const deletedProducts = deleteSale.products;
    deletedProducts.map(async (item) => {
      const prod = await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { StockQuantity: item.quantity }, // Increment the StockQuantity by item.quantity
        },
        { new: true }
      );

      console.log(prod);
    });
    await Selling.findByIdAndDelete(saleId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Sale deleted successfully"));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

const deleteProductOfSale = asyncHandler(async (req, res) => {
  const { saleId, productId } = req.params;

  const sale = await Selling.findById(saleId);
  try {
    if (!sale) {
      throw new ApiError("No sale found with this id check saleId again");
    }
    const saledProducts = sale.products;
    const productIndex = saledProducts.findIndex(
      (product) => product.productId == productId
    );
    if (productIndex === -1) {
      throw new ApiError("Product not found in this sale.");
    }
    const productToRemove = saledProducts[productIndex];
    const quantityToReturn = productToRemove.quantity;
    saledProducts.splice(productIndex, 1);

    sale.totalSaleAmount = saledProducts.reduce(
      (sum, product) => sum + product.total,
      0
    );

    await sale.save();
    const product = await Product.findById(productToRemove.productId);
    if (!product) {
      throw new ApiError(400, "Product not found in stock.");
    }
    product.StockQuantity += quantityToReturn;
    await product.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          202,
          sale,
          "Product removed and stock updated successfully."
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Error in deleting the sale product");
  }
});

const getDateSales = asyncHandler(async (req, res) => {
  const { date } = req.body;
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;

  if (!date) {
    throw new ApiError(400, "Please provide a valid date");
  }
  const inputDate = new Date(date.split("-").reverse().join("-"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate >= today) {
    throw new Error(
      "You can only enter past dates, not today or future dates."
    );
  }

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);
  const skip = (pageNumber - 1) * pageSize;
  try {
    const allsalesofDate = await Selling.aggregate([
      {
        $match: {
          owner: userId,
          date: date,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
      {
        $project: {
          _id: 1,
          customername: 1,
          contactno: 1,
          totalSaleAmount: 1,

          payment: 1,
          products: {
            $map: {
              input: "$products",
              as: "product",
              in: {
                productId: "$$product.productId",
                title: "$$product.title",
                quantity: "$$product.quantity",
                price: "$$product.price",
                total: "$$product.total",
              },
            },
          },
        },
      },
    ]);
    const totalSales = await Selling.countDocuments({
      owner: userId,
      date: date,
    });
    return res.status(200).json(
      new ApiResponse(
        201,
        {
          date,
          totalSales,
          totalPages: Math.ceil(totalSales / pageSize),
          currentPage: pageNumber,
          allsalesofDate,
        },
        "All sales of the given date sended successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch sales");
  }
});

const getTodaySales = asyncHandler(async (req, res) => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);
  const skip = (pageNumber - 1) * pageSize;
  try {
    const todayAllSale = await Selling.aggregate([
      {
        $match: {
          owner: userId,
          date: formattedDate,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
      {
        $project: {
          _id: 1,
          customername: 1,
          contactno: 1,
          totalSaleAmount: 1,
          payment: 1,
          products: {
            $map: {
              input: "$products",
              as: "product",
              in: {
                productId: "$$product.productId",
                title: "$$product.title",
                quantity: "$$product.quantity",
                price: "$$product.price",
                total: "$$product.total",
              },
            },
          },
        },
      },
    ]);
    const totalSales = await Selling.countDocuments({
      owner: userId,
      date: formattedDate,
    });
    return res.status(200).json(
      new ApiResponse(
        201,
        {
          formattedDate,
          totalSales,
          totalPages: Math.ceil(totalSales / pageSize),
          currentPage: pageNumber,
          todayAllSale,
        },
        "All sales of today sended successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch sales");
  }
});

export {
  createSale,
  getSaleById,
  deleteSale,
  getDateSales,
  updateSale,
  getTodaySales,
  deleteProductOfSale,
};
