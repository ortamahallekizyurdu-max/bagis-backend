const router = require("express").Router();
const { google } = require("googleapis");

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

router.post("/", async (req, res) => {
  const { sifre } = req.body;

  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Ayar!B1",
  });

  const sheetSifre = response.data.values?.[0]?.[0];

  if (sifre === sheetSifre) {
    return res.json({ ok: true });
  }

  res.status(401).json({ ok: false });
});

module.exports = router;