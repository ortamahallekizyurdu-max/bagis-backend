import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

/* GOOGLE AUTH */
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1TLELlXiZVlT9wacbbCKXM6gJkjzsj4C18ls8HzOmsI8";
/* SERVER OK */
app.get("/", (req, res) => {
  res.send("Server OK");
});

/* LOGIN */

app.post("/login", async (req, res) => {
  console.log("LOGIN İSTEĞİ GELDİ");
  try {
    const { sifre } = req.body;
    console.log("GELEN ŞİFRE:", sifre);

    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa6!B1",
    });

    console.log("SHEET CEVAP:", r.data);

    const sheetSifre = r.data.values?.[0]?.[0];
    console.log("SHEET ŞİFRE:", sheetSifre);

    if (sifre === sheetSifre) {
      return res.json({ ok: true });
    }

    res.status(401).json({ ok: false });

  } catch (err) {
    console.log("LOGIN HATA DETAY:", err);
    res.status(500).json({ ok: false });
  }
});


/* HİZMET EHLİ */
app.get("/hizmet-ehli", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa5!A2:A"
    });

    const rows = r.data.values || [];
    res.json(rows.map(r => r[0]).filter(Boolean));

  } catch (err) {
    res.status(500).json({ error: "İsimler alınamadı" });
  }
});

/* GÜNLÜK BAĞIŞ */
app.get("/gunluk/:isim", async (req, res) => {
  try {
    const { isim } = req.params;
    const { tarih } = req.query;

    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa1!A2:H"
    });

    const rows = r.data.values || [];

    let seciliTarih;

    if (tarih) {
      seciliTarih = tarih.trim();
    } else {
      const today = new Date();
      const gun = String(today.getDate()).padStart(2, "0");
      const ay = String(today.getMonth() + 1).padStart(2, "0");
      const yil = today.getFullYear();
      seciliTarih = `${gun}.${ay}.${yil}`;
    }

    const norm = (x) => String(x || "").trim();

    const parseTutar = (x) => {
      const s = String(x || "")
        .replace("₺", "")
        .replace("TL", "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    const sonuc = {};

    rows.forEach(row => {
      const rowTarih = norm(row[0]);
      const yardimAlan = norm(row[1]);
      const nevi = norm(row[2]);
      const tutar = parseTutar(row[6]);

      if (rowTarih !== seciliTarih) return;
      if (yardimAlan !== norm(isim)) return;
      if (!nevi) return;

      if (!sonuc[nevi]) sonuc[nevi] = 0;
      sonuc[nevi] += tutar;
    });

    let toplam = 0;
    for (let key in sonuc) {
      toplam += sonuc[key];
    }

    sonuc.TOPLAM = toplam;

    res.json(sonuc);

  } catch (err) {
    res.status(500).json({ error: "Günlük veri alınamadı" });
  }
});

/* DASHBOARD */
app.get("/dashboard", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa4!A2:H"
    });

    const rows = r.data.values || [];

    const parseTutar = (x) => {
      const temiz = String(x || "")
        .replace(/\./g,"")
        .replace(",",".");
      return Number(temiz) || 0;
    };

    const sonuc = rows.map(row => ({
      tarih: row[0] || "",
      isim: row[1] || "",
      nevi: row[2] || "",
      tutar: parseTutar(row[6])
    }));

    res.json(sonuc);

  } catch (err) {
    res.status(500).json({ error: "Dashboard verisi alınamadı" });
  }
});

/* BAĞIŞ EKLEME */
app.post("/bagislar", async (req, res) => {
  try {
    const {
      tarih,
      yardimAlan,
      bagisNevi,
      makbuzNo,
      dernekAdi,
      odemeCinsi,
      tutar,
      bagisYapan
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
    res.status(500).json({ error: "Hedefler alınamadı" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server çalışıyor");
});

/* DUYURULAR */
app.get("/duyurular", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa3!B2:B"
    });

    const rows = r.data.values || [];

    res.json(rows.map(row => ({ mesaj: row[0] })));

  } catch (err) {
    res.status(500).json({ error: "Duyuru alınamadı" });
  }
});

/* IFTAR LİSTESİ */
app.get("/iftar-listesi", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "IFTAR!A2:F"
    });

    const rows = r.data.values || [];

    res.json(
      rows.map(row => ({
        tarih: row[0] || "",
        iftarSahibi: row[1] || "",
        vesile: row[2] || "",
        erkek: row[3] || "0",
        hanim: row[4] || "0",
        tutar: row[5] || "0",
      }))
    );

  } catch (err) {
    console.log("IFTAR HATA:", err);
    res.status(500).json({ error: "İftar listesi alınamadı" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server çalışıyor");
});