import mongoose, { Schema } from "mongoose";

const SellingSchema = new Schema(
  {
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Soldproduct",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
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
