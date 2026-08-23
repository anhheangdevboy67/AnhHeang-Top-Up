const express = require('express');
const router = express.Router();

const { GAMES } = require('../games');
const { verifyPlayer } = require('../lib/playerLookup');

// POST /api/verify-player — check a player ID exists and return its nickname.
// Gracefully degrades: if no supplier is configured, tells the frontend
// verification isn't available rather than blocking checkout entirely.
router.post('/', async (req, res) => {
  try {
    const { gameId, playerId, zoneId } = req.body;
    const game = GAMES[gameId];

    if (!game) return res.status(400).json({ error: 'Unknown game.' });
    if (!playerId) return res.status(400).json({ error: 'playerId is required.' });
    if (game.needsZone && !zoneId) return res.status(400).json({ error: 'zoneId is required for this game.' });

    const result = await verifyPlayer(gameId, playerId, zoneId);

    if (!result.checked) {
      // Not an error — just means we can't verify right now.
      return res.json({ checked: false, reason: result.reason });
    }

    res.json({ checked: true, valid: result.valid, nickname: result.nickname || null });
  } catch (err) {
    console.error('verifyPlayer error:', err);
    res.status(500).json({ checked: false, error: 'Verification service error.' });
  }
});

module.exports = router;
