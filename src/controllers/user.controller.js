import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wround while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { shopname, ownername, email, password } = req.body;

  if (
    [shopname, ownername, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all filed are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "please enter valid email");
  }

  const existedUser = await User.findOne({
    $or: [{ shopname }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with this shopname or email already exist");
  }

  const user = await User.create({
    shopname: shopname.toLowerCase(),
    ownername: ownername.toLowerCase(),
    email,
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Somenting went wround while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registerd successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, shopname, password } = req.body;
  if (!shopname || !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ shopname }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );
  return (
    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options),
    json(new ApiResponse(200, {}, "User logged out successfully"))
  );
});

export { registerUser, loginUser, logoutUser };
