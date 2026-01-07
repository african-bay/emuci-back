const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// CONFIGURATION CORS : Accepte votre domaine Vercel et localhost
app.use(cors({
  origin: ['https://emuci-front.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- ROUTES POLICES ---
app.post('/polices', async (req, res) => {
  const { nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel } = req.body;
  
  // Validation de sécurité supplémentaire
  if (Number(plafond_famille) < Number(plafond_individuel)) {
    return res.status(400).json({ error: "Le plafond famille doit être supérieur ou égal au plafond individuel." });
  }

  try {
    const query = `INSERT INTO polices (nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ROUTE REPORTING ---
app.get('/reportings/prestataires', async (req, res) => {
  try {
    const query = `
      SELECT p.nom_etablissement, p.type_etablissement, 
      COUNT(d.id) as nombre_actes, 
      COALESCE(SUM(d.montant_total), 0) as ca_total,
      COALESCE(SUM(d.part_assurance), 0) as total_assurance
      FROM prestataires p
      LEFT JOIN depenses d ON p.id = d.prestataire_id
      GROUP BY p.id, p.nom_etablissement, p.type_etablissement`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Djeli démarré sur port ${PORT}`));