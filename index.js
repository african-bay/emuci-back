const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware de validation des montants positifs
const validatePositive = (req, res, next) => {
    const fields = ['plafond_famille', 'plafond_individuel', 'montant_total', 'plafond_valeur', 'franchise_valeur'];
    for (let field of fields) {
        if (req.body[field] && req.body[field] < 0) {
            return res.status(400).json({ error: `Le champ ${field} doit être positif.` });
        }
    }
    next();
};

// ROUTES POLICES
app.post('/polices', validatePositive, async (req, res) => {
    const { nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel, age_max_enfant } = req.body;
    try {
        const query = `INSERT INTO polices (nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel, age_max_enfant) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const result = await pool.query(query, [nom_police, entreprise, date_debut, date_fin, plafond_famille, plafond_individuel, age_max_enfant]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ROUTES PRESTATAIRES
app.post('/prestataires', async (req, res) => {
    const { nom, type, tel, adresse, contact } = req.body;
    try {
        const query = "INSERT INTO prestataires (nom_etablissement, type_etablissement, telephone, adresse, nom_contact) VALUES ($1,$2,$3,$4,$5) RETURNING *";
        const result = await pool.query(query, [nom, type, tel, adresse, contact]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/reportings/prestataires', async (req, res) => {
    try {
        const query = `
            SELECT p.nom_etablissement, p.type_etablissement, 
            COALESCE(SUM(d.montant_total), 0) as ca_total,
            COALESCE(SUM(d.part_assurance), 0) as total_assurance,
            COUNT(d.id) as nombre_actes
            FROM prestataires p
            LEFT JOIN depenses d ON p.id = d.prestataire_id
            GROUP BY p.id, p.nom_etablissement, p.type_etablissement`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(process.env.PORT || 3000, () => console.log("Backend Djeli V3 démarré"));