const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 5000;
const JWT_SECRET = "your_secret_key"; // Replace with a strong secret key

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://admin:admin@cluster0.bcdsb.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("connected", () => console.log("Connected to MongoDB"));
db.on("error", (error) => console.log("MongoDB connection error:", error));

// Admin Schema to store receiving email
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true }
});

const Admin = mongoose.model("Admin", adminSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

// Register Route
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: "Email already exists" });
    } else {
      res.status(500).json({ message: "Registration failed", error });
    }
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    // Fetch the admin's receiving email from MongoDB
   
    const receivingEmail = email;
    console.log("📧 Sending email to:", receivingEmail);

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hv062545@gmail.com", // Replace with your actual email
        pass: "jsbo jnrd iteg cxyn", // Use App Password if using Gmail
      },
    });

    const mailOptions = {
      from: email,
      to: receivingEmail,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    res.json({ message: "Thank you for reaching out! We'll get back to you soon." });

  } catch (error) {
    console.error("❌ Contact form submission error:", error); // Print the error in the terminal
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
