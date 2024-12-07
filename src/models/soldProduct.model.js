import mongoose, { Schema } from "mongoose";
const SoldProductSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
});

export const Soldproduct = mongoose.model("Soldproduct", SoldProductSchema);
