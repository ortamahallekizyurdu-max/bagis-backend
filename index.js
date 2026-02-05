import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json",
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
      range: "A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            new Date().toLocaleString("tr-TR"),
            ad,
            tutar,
            aciklama || ""
          ]
        ],
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("GOOGLE SHEETS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Backend çalışıyor: http://localhost:3000");
});
