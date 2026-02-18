import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

/* SERVICE ACCOUNT ENV'DEN OKU */
if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.error("GOOGLE_SERVICE_ACCOUNT TANIMLI DEĞİL!");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

/* SHEET ID */
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

    // BUGÜN (dd.MM.yyyy)
    const today = new Date();
    const gun = String(today.getDate()).padStart(2, "0");
    const ay = String(today.getMonth() + 1).padStart(2, "0");
    const yil = today.getFullYear();
    const bugun = `${gun}.${ay}.${yil}`;

    // Sheet'teki tarihi normalize et: 18/02/2026 -> 18.02.2026
    const normTarih = (t) =>
      String(t || "")
        .trim()
        .replace(/\//g, ".")
        .replace(/-/g, "."); // olur da 18-02-2026 varsa

    const norm = (x) => String(x || "").trim();

    const filtreli = rows.filter((row) => {
      const tarih = normTarih(row[0]); // A
      const yardimAlan = norm(row[1]); // B
      return tarih === bugun && yardimAlan === norm(isim);
    });

    const sonuc = {};

    filtreli.forEach((row) => {
      const nevi = norm(row[2]); // C
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
    });

    res.json(sonuc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Günlük veri alınamadı" });
  }
});

neviToplam.TOPLAM = toplam;

res.json(neviToplam);



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
      tutar,
    } = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sayfa1!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[
  tarih,        // A
  yardimAlan,   // B
  bagisNevi,    // C
  makbuzNo,     // D
  dernekAdi,    // E
  odemeCinsi,   // F
  tutar,        // G
  bagisYapan    // H
]]

      }
    });

    res.json({ ok: true });

  } catch (err) {
    console.error("POST HATA:", err);
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
      range: "Sayfa3!A2:B"
    });

    const rows = r.data.values || [];

    const duyurular = rows.map(row => ({
      duyuru: row[0] || "",
      mesaj: row[1] || ""
    }));

    res.json(duyurular);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Duyurular alınamadı" });
  }
});

/* DASHBOARD VERİ */
app.get("/dashboard", async (req, res) => {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa4!A2:H"
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


/* SERVER START */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server çalışıyor");
});
