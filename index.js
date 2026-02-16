import express from "express";
import cors from "cors";
import { google } from "googleapis";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

/* SERVICE ACCOUNT DOSYASINI OKU */
const serviceAccount = JSON.parse(
  fs.readFileSync("./service-account.json", "utf8")
);

/* SHEET ID BURAYA YAZ */
const SPREADSHEET_ID = "1TLELlXiZVlT9wacbbCKXM6gJkjzsj4C18ls8HzOmsI8";

/* GOOGLE AUTH */
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

/* ROOT */
app.get("/", (req, res) => {
  res.send("Server OK");
});

/* HİZMET EHLİ */
app.get("/hizmet-ehli", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sayfa2!A2:A`
    });

    const rows = r.data.values || [];
    const isimler = rows.map(row => row[0]).filter(Boolean);

    res.json(isimler);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "İsimler alınamadı" });
  }
});

/* GÜNLÜK BAĞIŞ */
app.get("/gunluk/:isim", async (req, res) => {
  try {
    const { isim } = req.params;

    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sayfa1!A2:H`
    });

    const rows = r.data.values || [];

    const today = new Date();
    const gun = String(today.getDate()).padStart(2, "0");
    const ay = String(today.getMonth() + 1).padStart(2, "0");
    const yil = today.getFullYear();
    const bugun = `${gun}.${ay}.${yil}`;

    const filtreli = rows.filter(row =>
      String(row[0]).trim() === bugun &&
      String(row[1]).trim() === isim.trim()
    );

    const neviToplam = {};

    filtreli.forEach(row => {
      const nevi = row[2];
      const tutar = Number(row[6]) || 0;

      if (!neviToplam[nevi]) neviToplam[nevi] = 0;
      neviToplam[nevi] += tutar;
    });

    res.json(neviToplam);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server çalışıyor");
});



app.listen(3000, () => {
  console.log("🚀 Server çalışıyor: http://localhost:3000");
});
