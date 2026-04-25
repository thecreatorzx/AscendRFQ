import {
  register as registerService,
  login as loginService,
} from "../services/auth.service.js";

const register = async (req, res, next) => {
  try {
    const { name, email, password, companyId, role } = req.body;
    if (!email || !password || !name || !companyId || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, Email, companyId, Role and Password are required",
      });
    }
    const user = await registerService(name, email, password, companyId, role);
    return res.status(201).json({ success: true, user });
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
        message: "Email, Password are required",
      });
    }
    const user = await loginService(email, password);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export { register, login };
