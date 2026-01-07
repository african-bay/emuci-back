const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// CORRECTION CORS : Autorise explicitement votre interface Vercel
app.use(cors({
  origin: 'https://emuci-front.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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

// --- ROUTES PRESTATAIRES ---
app.get('/prestataires', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM prestataires ORDER BY nom_etablissement ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/prestataires', async (req, res) => {
  const { nom, type, tel, adresse, contact } = req.body;
  try {
    const query = `INSERT INTO prestataires (nom_etablissement, type_etablissement, telephone, adresse, nom_contact) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(query, [nom, type, tel, adresse, contact]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));