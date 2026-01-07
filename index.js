const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// CORRECTION CORS : Autorise votre URL Vercel spécifiquement
app.use(cors({
  origin: 'https://emuci-front.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- ROUTES POLICES ---
app.get('/polices', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM polices ORDER BY nom_police ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/polices', async (req, res) => {
  const { nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel } = req.body;
  try {
    const query = `INSERT INTO polices (nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ROUTES PRESTATAIRES & REPORTING ---
app.get('/reportings/prestataires', async (req, res) => {
  try {
    const query = `
      SELECT p.nom_etablissement, p.type_etablissement, 
      COUNT(d.id) as nombre_actes, COALESCE(SUM(d.montant_total), 0) as ca_total
      FROM prestataires p
      LEFT JOIN depenses d ON p.id = d.prestataire_id
      GROUP BY p.id, p.nom_etablissement, p.type_etablissement`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));