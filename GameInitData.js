export const gameManager = {
    waitingPlayers: [], // Each entry: { userId, socket }
    sessions: {}
    // Keyed by game session ID. Example: { answersReceived: [{userid:answeNumber}], sockets: [socket1, socket2] }
};