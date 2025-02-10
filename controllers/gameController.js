import { gameManager } from "../GameInitData.js";
import tryCatch from "../utils/tryCatch.js";

const StartTheGame = tryCatch((req, res) => {
  const userId = req.user.userId;
  // Prevent duplicate waiting entries.
  if (gameManager.waitingPlayers.find(p => p.userId === userId))
    return res.status(400).json({ error: 'Already waiting for a match' });
  // We will add the user to waitingPlayers once their socket connects.
  // Here, we simply return a message.
  if (gameManager.waitingPlayers.length >= 2)
    return res.status(200).json({ msg: "you are more than a team of two players you can start playing game!" })

  gameManager.waitingPlayers.push({ userId })
  console.log("game manager", gameManager)
  res.json({ message: 'Waiting for an opponent. Please ensure you are connected via Socket.io.', gameManager });
})

export { StartTheGame }
