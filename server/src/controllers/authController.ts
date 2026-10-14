import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// 1. Register Controller
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "All fields are required!" });
      return;
    }

    const [existingUsers] = await db.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      res.status(400).json({ error: "This email is already registered!" });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    );

    res.status(201).json({
      message: "User registered successfully!",
      userId: result.insertId,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[Auth Error] Registration failed:", error.message);
      res
        .status(500)
        .json({ error: error.message || "Internal server error." });
    }
  }
};

// 2. Login Controller
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required!" });
      return;
    }

    const [users] = await db.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      res.status(401).json({ error: "Invalid email or password!" });
      return;
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password!" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "fallbacksecret";
    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[Auth Error] Login failed:", error.message);
      res
        .status(500)
        .json({ error: error.message || "Internal server error." });
    }
  }
};
