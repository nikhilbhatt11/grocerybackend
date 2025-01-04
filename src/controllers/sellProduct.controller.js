import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { Selling } from "../models/selling.model.js";

const createSale = asyncHandler(async (req, res) => {
  const { products, customername, contactNo, date, paymentMethod } = req.body;

  const userId = req.user._id;

  if (!products || products.length === 0) {
    throw new ApiError(400, "Products array cannot be empty");
  }

  if (!customername || !contactNo) {
    throw new ApiError(400, "Customer name and contact number are required");
  }

  const soldProducts = [];
  let calculatedTotalSaleAmount = 0;
  let totalBuypriceAmount = 0;
  for (const item of products) {
    const {
      _id,
      quantity,
      title,
      buyprice,
      discountedprice,
      total,
      totalwithbuyprice,
    } = item;

    if (
      !title ||
      !discountedprice ||
      discountedprice <= 0 ||
      !_id ||
      !quantity ||
      quantity <= 0
    ) {
      throw new ApiError(
        400,
        "All fields are required. Quantity and price should be greater than 0"
      );
    }

    try {
      const product = await Product.findById(_id);

      if (!product) {
        throw new ApiError(404, `Product with ID ${_id} not found`);
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
        _id,
        title,
        quantity,
        buyprice,
        discountedprice,

        total,
        totalwithbuyprice,
      };

      soldProducts.push(soldProduct);

      calculatedTotalSaleAmount += soldProduct.total;
      totalBuypriceAmount += soldProduct.totalwithbuyprice;
    } catch (error) {
      throw error;
    }
  }

  const sale = new Selling({
    products: soldProducts,
    customername,
    contactNo,
    totalSaleAmount: calculatedTotalSaleAmount,
    totalwithbuyprice: totalBuypriceAmount,
    owner: userId,
    date,
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
  const { quantity } = req.query;

  const sale = await Selling.findById(saleId);
  if (!sale) {
    throw new ApiError("No sale found with this id check saleId again");
  }

  const oldSaleTotal = sale.totalSaleAmount;

  const saledProducts = sale.products;
  const isProductExist = await Product.findById(productId);

  if (!isProductExist) {
    throw new ApiError(400, "Product is not in the list or maybe deleted");
  }
  const productIndex = saledProducts.findIndex(
    (product) => product._id == productId
  );
  const oldQuantity = saledProducts.find((product) => product._id == productId);

  if (productIndex === -1) {
    throw new ApiError(403, "error in finding the product in the sale");
  }

  if (!quantity || quantity <= 0) {
    throw new ApiError(400, "Quantity should be greater than 0.");
  }

  if (quantity > oldQuantity.quantity) {
    const diff = quantity - oldQuantity.quantity;
    if (isProductExist == null) {
      throw new ApiError(400, "Product is not in the list or maybe deleted");
    }
    if (isProductExist.StockQuantity < diff) {
      throw new ApiError(400, "Product is less in stock");
    }

    isProductExist.StockQuantity -= diff;
    await isProductExist.save();
  } else {
    const diff = oldQuantity.quantity - quantity;

    isProductExist.StockQuantity += diff;
    await isProductExist.save();
  }

  const productToUpdate = saledProducts[productIndex];

  productToUpdate.quantity = parseInt(quantity);

  productToUpdate.total = quantity * productToUpdate.discountedprice;

  saledProducts[productIndex] = productToUpdate;

  sale.totalSaleAmount = saledProducts.reduce(
    (sum, product) => sum + product.total,
    0
  );
  let newSaledifference;

  if (oldSaleTotal > sale.totalSaleAmount) {
    newSaledifference = sale.totalSaleAmount - oldSaleTotal;
  } else {
    newSaledifference = sale.totalSaleAmount - oldSaleTotal;
  }
  try {
    await sale.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          { sale, newSaledifference },
          "Sale updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Error in updating the sale");
  }
});

const deleteSale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;
  const deleteSale = await Selling.findById(saleId);

  if (!deleteSale) {
    throw new ApiError(
      400,
      "The sale with given id is not found or already deletd"
    );
  }

  try {
    const deletedProducts = deleteSale.products;

    deletedProducts.map(async (item) => {
      const prod = await Product.findByIdAndUpdate(
        item._id,
        {
          $inc: { StockQuantity: item.quantity },
        },
        { new: true }
      );
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
  if (!sale) {
    throw new ApiError("No sale found with this id check saleId again");
  }

  const saledProducts = sale.products;

  const productIndex = saledProducts.findIndex(
    (product) => product._id == productId
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
  const product = await Product.findById(productToRemove._id);

  if (!product) {
    throw new ApiError(400, "Product not found in stock.");
  }
  product.StockQuantity += quantityToReturn;
  try {
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
    throw new ApiError(500, "Error in deleting the sale product");
  }
});

const getDateSales = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const { page = 1, limit = 50 } = req.query;
  const userId = req.user._id;

  if (!date) {
    throw new ApiError(400, "Please provide a valid date");
  }
  const inputDate = new Date(date.split("-").reverse().join("-"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate >= today) {
    throw new ApiError(
      400,
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
                productId: "$$product._id",
                title: "$$product.title",
                quantity: "$$product.quantity",
                discountedprice: "$$product.discountedprice",
                total: "$$product.total",
              },
            },
          },
        },
      },
    ]);
    const totalEarning = await Selling.aggregate([
      {
        $match: {
          owner: userId,
          date: date,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalSaleAmount" },
        },
      },
    ]);
    const totalSales = await Selling.countDocuments({
      owner: userId,
      date: date,
    });

    const totalprofitOfDay = await Selling.aggregate([
      {
        $match: {
          owner: userId,
          date: date,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalwithbuyprice" },
        },
      },
    ]);
    return res.status(200).json(
      new ApiResponse(
        201,
        {
          date,
          totalSales,
          totalEarning,
          totalPages: Math.ceil(totalSales / pageSize),
          currentPage: pageNumber,
          allsalesofDate,
          totalprofitOfDay,
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

  const { page = 1, limit = 50 } = req.query;
  const userId = req.user._id;
  console.log("controller called");
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
          contactNo: 1,
          totalSaleAmount: 1,
          totalwithbuyprice: 1,
          payment: 1,
          products: {
            $map: {
              input: "$products",
              as: "product",
              in: {
                productId: "$$product._id",
                title: "$$product.title",
                quantity: "$$product.quantity",
                discountedprice: "$$product.discountedprice",
                total: "$$product.total",
              },
            },
          },
        },
      },
    ]);
    const totalEarningToday = await Selling.aggregate([
      {
        $match: {
          owner: userId,
          date: formattedDate,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalSaleAmount" },
        },
      },
    ]);
    const totalprofitToday = await Selling.aggregate([
      {
        $match: {
          owner: userId,
          date: formattedDate,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalwithbuyprice" },
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
          totalEarningToday,
          totalprofitToday,
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

const getMonthlySales = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  const currentYear = now.getFullYear();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const sales = await Selling.aggregate([
    {
      $match: {
        owner: userId,

        date: {
          $regex: `^\\d{2}-\\d{2}-${currentYear}$`,
        },
      },
    },

    {
      $group: {
        _id: { month: { $substr: ["$date", 3, 2] } },
        total: { $sum: "$totalSaleAmount" },
        margin: {
          $sum: { $subtract: ["$totalSaleAmount", "$totalwithbuyprice"] },
        },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  const formattedSales = sales.map((entry) => {
    const monthIndex = parseInt(entry._id.month, 10) - 1;
    return {
      monthId: entry._id.month,
      monthName: monthNames[monthIndex],
      total: entry.total,
      margin: entry.margin,
    };
  });
  if (formattedSales.length == 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(202, [], "Do Sales then only the data will be shown")
      );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        202,
        formattedSales,
        "monthly sales data sended successfully"
      )
    );
});

export {
  createSale,
  getSaleById,
  deleteSale,
  getDateSales,
  updateSale,
  getTodaySales,
  deleteProductOfSale,
  getMonthlySales,
};
