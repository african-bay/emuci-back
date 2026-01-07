const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// --- CONFIGURATION DE SÉCURITÉ (TRÈS IMPORTANT) ---
app.use(cors()); // Autorise votre site Vercel à parler à ce serveur
app.use(express.json()); // Permet de lire les données envoyées par le formulaire

// Connexion à Supabase via la variable d'environnement DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- ROUTES ---

// 1. LIRE : Récupérer tous les bénéficiaires (Fichier à jour)
app.get('/salaries', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM salaries_complet ORDER BY nom ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

// 2. AFFILIER : Ajouter un nouveau salarié au contrat
app.post('/salaries', async (req, res) => {
  try {
    const { nom, prenom, email, poste, situation_familiale } = req.body;
    const query = `
      INSERT INTO salaries_complet (nom, prenom, email, poste, situation_familiale, statut_contrat) 
      VALUES ($1, $2, $3, $4, $5, 'Actif') 
      RETURNING *`;
    const values = [nom, prenom, email, poste, situation_familiale];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de l'ajout" });
  }
});

// 3. MISE À JOUR : Changer la situation familiale ou déclarer des ayants droit
app.put('/salaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { situation_familiale, ayants_droit_noms } = req.body;
    const query = `
      UPDATE salaries_complet 
      SET situation_familiale = $1, ayants_droit_noms = $2, derniere_mise_a_jour = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *`;
    const result = await pool.query(query, [situation_familiale, ayants_droit_noms, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// 4. RADIER : Sortie d'un salarié (Démission, Retraite, etc.)
app.patch('/salaries/:id/radier', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_sortie } = req.body;
    const query = `
      UPDATE salaries_complet 
      SET statut_contrat = 'Radie', date_sortie = $1, derniere_mise_a_jour = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *`;
    const result = await pool.query(query, [date_sortie, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la radiation" });
  }
});

// --- LANCEMENT DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Le backend Djeli est en ligne sur le port ${PORT}`);
});