const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 1. Lire tous les salariés (Fichier à jour)
app.get('/salaries', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM salaries_complet ORDER BY nom ASC");
        res.json(result.rows);
    } catch (err) { res.status(500).json(err.message); }
});

// 2. Affilier (Ajouter) un nouveau salarié
app.post('/salaries', async (req, res) => {
    const { nom, prenom, email, poste, situation_familiale } = req.body;
    try {
        const query = "INSERT INTO salaries_complet (nom, prenom, email, poste, situation_familiale) VALUES ($1, $2, $3, $4, $5) RETURNING *";
        const result = await pool.query(query, [nom, prenom, email, poste, situation_familiale]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json(err.message); }
});

// 3. Mettre à jour (Situation familiale / Ayants droit)
app.put('/salaries/:id', async (req, res) => {
    const { id } = req.params;
    const { situation_familiale, ayants_droit_noms } = req.body;
    try {
        const query = "UPDATE salaries_complet SET situation_familiale = $1, ayants_droit_noms = $2 WHERE id = $3 RETURNING *";
        const result = await pool.query(query, [situation_familiale, ayants_droit_noms, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json(err.message); }
});

// 4. Radier (Sortie du salarié)
app.patch('/salaries/:id/radier', async (req, res) => {
    const { id } = req.params;
    const { date_sortie } = req.body;
    try {
        const query = "UPDATE salaries_complet SET statut_contrat = 'Radie', date_sortie = $1 WHERE id = $2 RETURNING *";
        const result = await pool.query(query, [date_sortie, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json(err.message); }
});

app.listen(process.env.PORT || 3000, () => console.log("Serveur démarré"));