const multer = require("multer");
const uuid = require("uuid").v4;
const User = require("../models/userModel");
const { checkToken } = require("../services/jwtServices");
const { HttpError } = require("../utils/httpError");

exports.protect = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.startsWith("Bearer ") &&
      req.headers.authorization.split(" ")[1];

    if (!token) throw new HttpError(401, "Not authorized");

    const userId = await checkToken(token);

    if (!userId) throw new HttpError(401, "Not authorized");

    const currentUser = await User.findById(userId).select("-password");

    if (!currentUser) throw new HttpError(401, "Not authorized");

    req.user = currentUser;

    next();
  } catch (error) {
    next(error);
  }
};

const multerStorage = multer.diskStorage({
  destination: (req, file, cbk) => {
    cbk(null, "tmp");
  },
  filename: (req, file, cbk) => {
    const extension = file.mimetype.split("/")[1];

    cbk(null, `${req.user.id}-${uuid()}.${extension}`);
	 
  },
});

const multerFilter = (req, file, cbk) => {
  if (file.mimetype.startsWith("image/")) {
    cbk(null, true);
  } else {
    cbk(new HttpError(400, "Bad Request"), false);
  }
};

exports.uploadAvatar = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
}).single("avatar");
