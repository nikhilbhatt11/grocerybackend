import mongoose, { Schema } from "mongoose";

const SellingSchema = new Schema(
  {
    products: [
      {
        _id: {
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

        discountedprice: {
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
    totalwithbuyprice: {
      type: Number,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: String,
      required: true,
    },
    payment: {
      type: String,
      enum: ["cash", "card", "Online", "udhar"],
    },
  },
  { timestamps: true }
);

export const Selling = mongoose.model("Selling", SellingSchema);
