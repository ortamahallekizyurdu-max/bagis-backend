console.log("RAMAZAN TEST 123");

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  keyFile: "./service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

/* ROOT */
app.get("/", (req, res) => {
  res.send("Server OK");
});

/* BAĞIŞ EKLE */
app.post("/bagislar", async (req, res) => {
  try {
    const {
      tarih,
      yardimAlan,
      bagisNevi,
      makbuzNo,
      dernekAdi,
      odemeCinsi,
      bagisYapan,
      tutar,
    } = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sayfa1!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[
          tarih,
          yardimAlan,
          bagisNevi,
          makbuzNo,
          dernekAdi,
          odemeCinsi,
          tutar,
          bagisYapan
        ]]
      }
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bağış eklenemedi" });
  }
});

/* BAĞIŞLAR */
app.get("/bagislar", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sayfa1!A:H`
    });

    const rows = r.data.values || [];
    res.json(rows.slice(1));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Veri alınamadı" });
  }
});

/* HEDEFLER */
app.get("/hedefler", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sayfa2!A2:B`
    });

    const rows = r.data.values || [];

    res.json(
      rows.map((row, index) => ({
        id: index + 1,
        yardimAlan: row[0],
        hedef: Number(row[1]) || 0
      }))
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Hedefler alınamadı" });
  }
});

/* DUYURULAR */
app.get("/duyurular", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sayfa3!A2:B`
    });

    const rows = r.data.values || [];

    res.json(
      rows.map((row, index) => ({
        id: index + 1,
        baslik: row[0],
        mesaj: row[1]
      }))
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Duyurular alınamadı" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Arka uç çalışıyor:", PORT);
});
