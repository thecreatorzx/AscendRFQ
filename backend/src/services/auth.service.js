import bcryptjs from "bcryptjs";
import prisma from "../utils/db.js";
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};
const register = async (name, email, password, role, companyId) => {
  const userExists = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (userExists) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcryptjs.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      companyId,
    },
  });
  const token = generateToken(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, token };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error("User does not exist");
  }
  const verifyPassword = await bcryptjs.compare(password, user.password);
  if (!verifyPassword) {
    throw new Error("Wrong Credentials");
  }
  const token = generateToken(user);

  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

export { register, login };
