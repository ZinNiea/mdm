// server/user/userController.js
const { createUser, getUserByEmail } = require('./userModel');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userId = await createUser({ name, email, password });
    res.status(201).json({ id: userId, name, email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (user && user.password === password) {
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
