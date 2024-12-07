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
    totalSaleAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Selling = mongoose.model("Selling", SellingSchema);
