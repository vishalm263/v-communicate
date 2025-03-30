import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks
    sameSite: "none", // Changed from strict to support cross-domain
    secure: true, // Always use secure when sameSite is None
    path: "/",
  });

  return token;
};
