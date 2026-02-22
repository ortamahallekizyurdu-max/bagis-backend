import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* GOOGLE AUTH */
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || `{
  "type": "service_account",
  "project_id": "izin-takip-485103",
  "private_key_id": "7cb4ecd84898cc9e51ed52fd76de7894aa493c0c",
  "private_key": "${process.env.FIREBASE_PRIVATE_KEY}",
  "client_email": "bagis-servis@izin-takip-485103.iam.gserviceaccount.com",
  "client_id": "101475662392840260727",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/bagis-servis%40izin-takip-485103.iam.gserviceaccount.com"
}`);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

/* SERVER OK */
app.get("/", (req, res) => res.send("Server OK"));

/* LOGIN */
app.post("/login", async (req, res) => {
  try {
    const { sifre } = req.body;
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa6!B1",
    });
    const sheetSifre = r.data.values?.[0]?.[0];
    if (sifre === sheetSifre) return res.json({ ok: true });
    res.status(401).json({ ok: false });
  } catch {
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
  } catch {
    res.status(500).json({ error: "İsimler alınamadı" });
  }
});

/* GÜNLÜK BAĞIŞ */
app.get("/gunluk/:isim", async (req, res) => {
  try {
    const { isim } = req.params;
    const { tarih } = req.query;
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "Sayfa1!A2:H" });
    const rows = r.data.values || [];
    const seciliTarih = tarih ? tarih.trim() : (() => {
      const today = new Date();
      return `${String(today.getDate()).padStart(2,"0")}.${String(today.getMonth()+1).padStart(2,"0")}.${today.getFullYear()}`;
    })();
    const norm = x => String(x||"").trim();
    const parseTutar = x => { const n = Number(String(x||"").replace(/₺|TL|\s|\./g,"").replace(",", ".")); return Number.isFinite(n)?n:0; };
    const sonuc = {};
    rows.forEach(row => {
      if (norm(row[0])!==seciliTarih || norm(row[1])!==norm(isim) || !norm(row[2])) return;
      if (!sonuc[row[2]]) sonuc[row[2]]=0;
      sonuc[row[2]]+=parseTutar(row[6]);
    });
    sonuc.TOPLAM = Object.values(sonuc).reduce((a,b)=>a+b,0);
    res.json(sonuc);
  } catch {
    res.status(500).json({ error: "Günlük veri alınamadı" });
  }
});

/* DASHBOARD */
app.get("/dashboard", async (req,res)=>{
  try {
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "Sayfa4!A2:H" });
    const rows = r.data.values || [];
    const sonuc = rows.map(row=>({tarih:row[0]||"",isim:row[1]||"",nevi:row[2]||"",tutar:Number(String(row[6]||0).replace(/\./g,"").replace(",", "."))}));
    res.json(sonuc);
  } catch { res.status(500).json({error:"Dashboard verisi alınamadı"}); }
});

/* BAĞIŞ EKLEME */
app.post("/bagislar", async (req,res)=>{
  try {
    const { tarih, yardimAlan, bagisNevi, makbuzNo, dernekAdi, odemeCinsi, tutar, bagisYapan } = req.body;
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sayfa1!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values:[[tarih, yardimAlan, bagisNevi, makbuzNo, dernekAdi, odemeCinsi, tutar, bagisYapan]] }
    });
    res.json({ ok: true });
  } catch { res.status(500).json({ error:"Bağış eklenemedi" }); }
});

/* HEDEFLER */
app.get("/hedefler", async (req,res)=>{
  try {
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range:"Sayfa2!A2:B" });
    const rows = r.data.values || [];
    res.json(rows.map((row,index)=>({id:index+1,yardimAlan:row[0],hedef:Number(row[1]||0)})));
  } catch { res.status(500).json({error:"Hedefler alınamadı"}); }
});

/* DUYURULAR */
app.get("/duyurular", async (req,res)=>{
  try {
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range:"Sayfa3!B2:B" });
    const rows = r.data.values || [];
    res.json(rows.map(row=>({mesaj:row[0]})));
  } catch { res.status(500).json({error:"Duyuru alınamadı"}); }
});

/* SUNUCU */
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("🚀 Server çalışıyor"));