import {
  register as registerService,
  login as loginService,
} from "../services/auth.service.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 1 * 60 * 60 * 1000,
};
const register = async (req, res, next) => {
  try {
    const { name, email, password, companyId, role } = req.body;
    if (!email || !password || !name || !companyId || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const { user, token } = await registerService(
      name,
      email,
      password,
      companyId,
      role,
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: "User registered and logged in successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { name, email, password, companyId, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }
    const { user, token } = await loginService(email, password);
    res.cookie("token", token, COOKIE_OPTIONS);
    return res
      .status(200)
      .json({ success: true, message: "Logged in successfully", user });
  } catch (error) {
    next(error);
  }
};
const logout = async (req, res) => {
  res.clearCookie("token");
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

export { register, login, logout };
