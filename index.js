console.log("RAMAZAN TEST 123");

import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/bagis", (req, res) => {
  res.send("bagis endpoint ayakta");
});

app.get("/", (req, res) => {
  res.send("OK");
});

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

app.post("/bagis", async (req, res) => {
  try {
    const { ad, tutar, aciklama } = req.body;

    if (!ad || !tutar) {
      return res.status(400).json({ error: "Zorunlu alan eksik" });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toLocaleString("tr-TR"),
          ad,
          tutar,
          aciklama || ""
        ]],
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("GOOGLE SHEETS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Backend çalışıyor:", PORT);
});

