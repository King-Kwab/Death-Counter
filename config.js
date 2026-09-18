require('dotenv').config();

/**
 * Player configuration.
 * Update the `name` fields with your actual player/streamer names.
 * Avatar images go in public/avatars/ — set the filename here.
 * API keys are loaded from environment variables for security.
 */
const config = {
  port: process.env.PORT || 3000,

  adminKey: process.env.ADMIN_KEY || 'admin-change-me-xyz999',

  players: {
    player1: {
      name: 'Foxhoundkaz',
      avatar: '/avatars/player1.png',
      apiKey: process.env.PLAYER1_KEY || 'p1-change-me-abc123',
    },
    player2: {
      name: 'KingKwab',
      avatar: '/avatars/player2.png',
      apiKey: process.env.PLAYER2_KEY || 'p2-change-me-def456',
    },
    player3: {
      name: 'Jigajuicy',
      avatar: '/avatars/player3.png',
      apiKey: process.env.PLAYER3_KEY || 'p3-change-me-ghi789',
    },
    player4: {
      name: 'KILLABUNNY',
      avatar: '/avatars/player4.png',
      apiKey: process.env.PLAYER4_KEY || 'p4-change-me-jkl012',
    },
  },
};

module.exports = config;
