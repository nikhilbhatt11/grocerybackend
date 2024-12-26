import mongoose, { Schema } from "mongoose";

const WishlistSchema = new Schema(
  {
    subTodos: [
      {
        id: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    heading: {
      type: String,
      required: true,
    },
    isTodoListCompleted: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Wishlist = mongoose.model("Wishlist", WishlistSchema);
