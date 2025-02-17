import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
const options = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 20 * 60 * 60 * 1000,
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();

    // const refreshToken = user.generateRefreshToken();

    // user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wroung while generating refresh and access token"
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

  if (!(shopname || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { shopname }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return (
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      // .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            // refreshToken,
          },
          "user logged in successfully"
        )
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
      // .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"))
  );
});

// const refreshAccessToken = asyncHandler(async (req, res) => {
//   const incomingRefreshToken =
//     req.cookies.refreshToken || req.body.refreshToken;

//   if (!incomingRefreshToken) {
//     throw new ApiError(401, "Unauthorized request");
//   }

//   try {
//     const decodedToken = jwt.verify(
//       incomingRefreshToken,
//       process.env.REFRESH_TOKEN_SECRET
//     );

//     const user = await User.findById(decodedToken?._id);
//     if (!user) {
//       throw new ApiError(401, "Invalid refresh token");
//     }

//     if (incomingRefreshToken !== user?.refreshToken) {
//       throw new ApiError(401, "Refresh token is expired or used");
//     }

//     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
//       user._id
//     );

//     return res
//       .status(200)
//       .cookie("accessToken", accessToken, options)
//       .cookie("refreshToken", refreshToken, options)
//       .json(
//         new ApiResponse(
//           200,
//           { accessToken, refreshToken: refreshToken, user },
//           "Access Toke refresh successfully"
//         )
//       );
//   } catch (error) {
//     throw new ApiError(401, error?.message || "Invalid refresh token");
//   }
// });

// const changeCurrentPassword = asyncHandler(async (req, res) => {
//   const { oldPassword, newPassword, confirmPassword } = req.body;
//   if (newPassword !== confirmPassword) {
//     throw new ApiError(400, "confirm password not match with new password");
//   }
//   const user = await User.findById(req.user?._id);
//   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
//   if (!isPasswordCorrect) {
//     throw new ApiError(400, "Invalid old password");
//   }
//   user.password = newPassword;
//   await user.save({ validateBeforeSave: false });

//   return res
//     .status(200)
//     .json(new ApiResponse(201, {}, "Password change successfully"));
// });

// const getCurrentUser = asyncHandler(async (req, res) => {
//   return res
//     .status(200)
//     .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
// });

// const updateAccountDetails = asyncHandler(async (req, res) => {
//   const { ownername, email } = req.body;
//   if (!fullname || !email) {
//     throw new ApiError(400, "All fields are required");
//   }

//   const user = await User.findByIdAndUpdate(
//     req.user?._id,
//     {
//       $set: {
//         ownername,
//         email,
//       },
//     },
//     { new: true }
//   ).select("-password");

//   return res.status(200).json(new ApiResponse(200, user, "Account updated"));
// });

export {
  registerUser,
  loginUser,
  logoutUser,
  // refreshAccessToken,
  // changeCurrentPassword,
  // getCurrentUser,
  // updateAccountDetails,
};
