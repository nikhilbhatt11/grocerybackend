import mongoose, { Schema } from "mongoose";

const SellingSchema = new Schema(
  {
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],

    customername: {
      type: String,
      required: true,
    },
    contactNo: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\+?[0-9]{10,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid contact number!`,
      },
    },
    totalSaleAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Selling = mongoose.model("Selling", SellingSchema);
