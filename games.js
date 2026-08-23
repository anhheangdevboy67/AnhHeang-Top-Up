// Server-side source of truth for games, packages, and prices.
// NEVER trust price/amount sent from the frontend — always look it up here.
// Keep this in sync with the GAMES array in the frontend (index.html),
// but only what's listed here can actually be purchased.

const GAMES = {
  freefire: {
    name: 'Free Fire',
    needsZone: false,
    packages: [
      { id: 'ff_100', label: '100 💎', amount: 1.10 },
      { id: 'ff_210', label: '210 💎', amount: 2.15 },
      { id: 'ff_355', label: '355 💎', amount: 3.55 },
      { id: 'ff_720', label: '720 💎', amount: 7.00 },
      { id: 'ff_1450', label: '1450 💎', amount: 13.90 },
      { id: 'ff_2180', label: '2180 💎', amount: 20.50 },
    ],
  },
  mlbb: {
    name: 'Mobile Legends',
    needsZone: true,
    packages: [
      { id: 'ml_56', label: '56 💎', amount: 1.35 },
      { id: 'ml_112', label: '112 💎', amount: 2.65 },
      { id: 'ml_336', label: '336 💎', amount: 7.60 },
      { id: 'ml_570', label: '570 💎', amount: 12.50 },
      { id: 'ml_1163', label: '1163 💎', amount: 24.90 },
      { id: 'ml_2195', label: '2195 💎', amount: 46.00 },
    ],
  },
};

function getPackage(gameId, packageId) {
  const game = GAMES[gameId];
  if (!game) return null;
  const pkg = game.packages.find((p) => p.id === packageId);
  if (!pkg) return null;
  return { game, pkg };
}

module.exports = { GAMES, getPackage };
