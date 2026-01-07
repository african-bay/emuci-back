const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configuration de la base de données (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Récupérer tous les salariés
app.get('/salaries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM salaries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Ajouter un salarié (Manuel)
app.post('/salaries', async (req, res) => {
  const { matricule, nom, prenom, salaire_brut, categorie } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO salaries (matricule, nom, prenom, salaire_brut, categorie) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [matricule, nom, prenom, salaire_brut, categorie]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Import Excel / CSV
app.post('/salaries/import', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (let row of data) {
      await pool.query(
        'INSERT INTO salaries (matricule, nom, prenom, salaire_brut, categorie) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (matricule) DO NOTHING',
        [row.Matricule, row.Nom, row.Prenom, row.Salaire, row.Categorie]
      );
    }
    res.json({ success: true, message: `${data.length} salariés traités.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Calcul des cotisations (Prime Globale)
app.get('/cotisations/calcul', async (req, res) => {
  try {
    const config = await pool.query('SELECT * FROM police_config LIMIT 1');
    const countResult = await pool.query('SELECT COUNT(*) FROM salaries WHERE statut = $1', ['ACTIF']);
    
    const primeAnnuelle = config.rows[0].prime_globale_annuelle;
    const effectif = parseInt(countResult.rows[0].count);
    const parTete = effectif > 0 ? (primeAnnuelle / 12) / effectif : 0;

    res.json({
      primeAnnuelle,
      effectif,
      quotePartIndividuelle: parTete,
      partPatronale: parTete * config.rows[0].part_patronale_pourcentage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur Djeli démarré sur le port ${PORT}`));