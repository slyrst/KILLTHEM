// server.js
// -----------------------------------------------------------------
// KILLTHEM için basit Node.js sunucusu.
// 1) game.html, levels.js, images/, musics/ klasörünü statik olarak sunar.
// 2) Creator editöründeki "PUBLISH" butonundan gelen level verisini
//    GERÇEKTEN levels.js dosyasına yazar, böylece F5 atan / siteye
//    yeniden giren HERKES yeni leveli görür (sadece senin tarayıcında
//    değil, localStorage'a değil, diske kaydedilir).
//
// KURULUM:
//   1) Bu dosyayı game.html ile AYNI klasöre koy.
//   2) Terminalde o klasöre gir:  cd proje-klasoru
//   3) npm init -y
//   4) npm install express
//   5) node server.js
//   6) Tarayıcıdan http://localhost:3000 aç (dosyayı çift tıklayarak
//      açmak yerine MUTLAKA bu adresten aç, yoksa fetch/POST istekleri
//      çalışmaz).
// -----------------------------------------------------------------

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const LEVELS_FILE = path.join(ROOT, 'levels.js');

app.use(express.json({ limit: '15mb' }));
app.use(express.static(ROOT));

// ---- levels.js dosyasını oku/parse et ----
function readLevels() {
  if (!fs.existsSync(LEVELS_FILE)) return {};
  const raw = fs.readFileSync(LEVELS_FILE, 'utf8');
  const match = raw.match(/CUSTOM_LEVELS\s*=\s*(\{[\s\S]*\});?/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    console.warn('levels.js parse edilemedi:', e.message);
    return {};
  }
}

function writeLevels(obj) {
  const output =
    '// Bu dosyayi elle degistirme - server.js tarafindan otomatik\n' +
    '// PUBLISH islemi ile guncellenir.\n' +
    'window.CUSTOM_LEVELS = ' + JSON.stringify(obj, null, 2) + ';\n';
  fs.writeFileSync(LEVELS_FILE, output, 'utf8');
}

// ---- Creator şifre kontrolü (server tarafında) ----
// İstersen buradan değiştir. Şu an sabit "ultra".
const CREATOR_PASSWORD = process.env.CREATOR_PASSWORD || 'ultra';

app.post('/api/check-password', (req, res) => {
  const { password } = req.body || {};
  const ok = typeof password === 'string' && password.trim() === CREATOR_PASSWORD;
  res.json({ ok });
});

// ---- Level yayınlama ----
// Body: { levelId: "stage3_arena1", data: { ...editorden gelen json... } }
app.post('/api/publish-level', (req, res) => {
  try {
    const { levelId, data } = req.body || {};
    if (!levelId || !data) {
      return res.status(400).json({ ok: false, error: 'levelId ve data zorunlu' });
    }
    const all = readLevels();
    all[levelId] = data;
    writeLevels(all);
    res.json({ ok: true, levelId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Tüm levelleri listele (editör açılışta bunu çekebilir) ----
app.get('/api/levels', (req, res) => {
  res.json(readLevels());
});

// ---- Tek bir leveli sil ----
app.delete('/api/levels/:id', (req, res) => {
  const all = readLevels();
  delete all[req.params.id];
  writeLevels(all);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log('----------------------------------------');
  console.log(`KILLTHEM sunucusu calisiyor:`);
  console.log(`  http://localhost:${PORT}`);
  console.log('----------------------------------------');
});
