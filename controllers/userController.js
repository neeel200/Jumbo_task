import tryCatch from "../utils/tryCatch.js";
import User from "../models/user.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const RegisterUser = tryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  // Check if the username is already taken.
  const existingUser = await User.findOne({ username });
  if (existingUser)
    return res.status(400).json({ error: 'User already exists' });
  // Hash the password.
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.json({ message: 'User registered successfully' });
});


const UserLogin = tryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user)
    return res.status(400).json({ error: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ error: 'Invalid credentials' });
  // Create JWT valid for 1 hour.
  const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});


export { RegisterUser, UserLogin };
