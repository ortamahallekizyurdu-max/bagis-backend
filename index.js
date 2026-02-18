import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.error("GOOGLE_SERVICE_ACCOUNT TANIMLI DEĞİL!");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const SPREADSHEET_ID = "1TLELlXiZVlT9wacbbCKXM6gJkjzsj4C18ls8HzOmsI8";

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

app.get("/", (req, res) => {
  res.send("Server OK");
});


/* HİZMET EHLİ İSİMLER */
app.get("/hizmet-ehli", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa2!A2:A"
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
      range: "Sayfa1!A2:H"
    });

    const rows = r.data.values || [];

    const sonuc = {};
    let toplam = 0;

    const filtreli = rows.filter(row =>
      String(row[1] || "").trim() === String(isim || "").trim()
    );

    filtreli.forEach(row => {
      const nevi = String(row[2] || "").trim();

      const tutar = Number(
        String(row[6] || "0")
          .replace("₺", "")
          .replace("TL", "")
          .replace(/\./g, "")
          .replace(",", ".")
      ) || 0;

      if (!nevi) return;

      if (!sonuc[nevi]) sonuc[nevi] = 0;
      sonuc[nevi] += tutar;
      toplam += tutar;
    });

    sonuc.TOPLAM = toplam;

    res.json(sonuc);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Günlük veri alınamadı" });
  }
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
      tutar
    } = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa1!A1",
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
    console.error("POST HATA:", err);
    res.status(500).json({ error: "Bağış eklenemedi" });
  }
});


/* HEDEFLER */
app.get("/hedefler", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa2!A2:B"
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


/* DASHBOARD */
app.get("/dashboard", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa1!A2:H"
    });

    const rows = r.data.values || [];

    const sonuc = rows.map(row => ({
      tarih: row[0] || "",
      isim: row[1] || "",
      nevi: row[2] || "",
      tutar: Number(row[6]) || 0
    }));

    res.json(sonuc);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard verisi alınamadı" });
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server çalışıyor");
});