import mongoose from "mongoose";
import { gameManager } from "../GameInitData.js";
import { GameSession } from "../models/GameSession.js";
import { QuestionModel } from "../models/question.js";


export const socketHandler = (io) => {

    io.on('connection', (socket) => {
  
        console.log(`User connected: ${socket.user.username}`);

        // When a socket connects, add/update the waiting player list.
        let waitingPlayer = gameManager.waitingPlayers.find(p => p.userId === socket.user.userId);
        if (waitingPlayer) {
            waitingPlayer.socket = socket;
        } else {
            gameManager.waitingPlayers.push({ userId: socket.user.userId, socket });
        }

        // Attempt to match players if at least 2 are waiting.
        const availablePlayers = gameManager.waitingPlayers;
        if (availablePlayers.length >= 2) {
           

            // Get the first two waiting players.
            const [player1, player2] = availablePlayers.slice(0, 2);
            // Remove them from waiting queue.
            gameManager.waitingPlayers = gameManager.waitingPlayers.filter(
                p => p.userId !== player1.userId && p.userId !== player2.userId
            );
            // Create a new game session.
            createGameSession(player1, player2);
        }

        // Listen for answer submissions.
        socket.on('answer:submit', async (data) => {
          
            const { sessionId, answer, questionIndex } = data;
            try {
                let session = await GameSession.findOne({ _id: new mongoose.Types.ObjectId(sessionId) });
                // console.log(session)
                if (!session || session.finished) return;

                // Make sure the submitted answer corresponds to the current question.

                const QuestionIndexForCurrentUser = session.currentUserQuestionsMap.get(socket.user.userId.toString());

                if (QuestionIndexForCurrentUser !== questionIndex) {
                    socket.emit("question:error", { error: "wrong question index" })
                    console.log("wrong question index");
                    return;
                }

                // Validate the answer.
                const currentQuestion = session.questions[questionIndex];
                if (currentQuestion.correctAnswer === answer) {
                    let currentScore = session.scores.get(socket.user.userId.toString()) || 0;
                    session.scores.set(socket.user.userId.toString(), ++currentScore);
                    console.log('current score', session.scores.get(socket.user.userId.toString()))
                }

                // Track answer submission using the in-memory session.
                const sessionKey = sessionId.toString();
                if (!gameManager.sessions[sessionKey]) {
                 
                    gameManager.sessions[sessionKey] = {
                        answersReceived: new Map(),
                        sockets: []
                    };
                    console.log("game data not defined!", gameManager)

                }
                const currentUserAnswerCount = gameManager.sessions[sessionKey].answersReceived.get(socket.user.userId.toString()) || 0;
                gameManager.sessions[sessionKey].answersReceived.set(socket.user.userId.toString(), currentUserAnswerCount + 1)

                let currentUserQuestionIndex = session.currentUserQuestionsMap.get(socket.user.userId.toString()) || 0;
                session.currentUserQuestionsMap.set(socket.user.userId.toString(), ++currentUserQuestionIndex)

                if (currentUserQuestionIndex < session.questions.length) {
                    // Send the next question to both players.
                    const nextQuestion = session.questions[currentUserQuestionIndex];
                    const questionData = {
                        questionText: nextQuestion.questionText,
                        choices: nextQuestion.choices,
                        questionIndex: currentUserQuestionIndex
                    };

                    gameManager.sessions[sessionKey].sockets.forEach(s => { if (socket.id === s.id) s.emit('question:send', questionData) }); //
                    await session.save();
               
                } else {
                    let allPlayersCompleted = session.players.every(playerId =>
                        session.currentUserQuestionsMap.get(playerId.toString()) >= session.questions.length - 1
                    );

                    if (!allPlayersCompleted) {
                        socket.emit('game:waiting', { message: "Waiting for the other player to finish..." });
                    } else {
                        session.finished = true;
                        await session.save();


                        // Determine the winner
                        let scores = [];
                        session.players.forEach(playerId => {
                            scores.push({
                                playerId,
                                score: session.scores.get(playerId.toString()) || 0
                            });
                        });
                        let winner = null;
                        if (scores[0].score > scores[1].score) {
                            winner = scores[0].playerId;
                        } else if (scores[1].score > scores[0].score) {
                            winner = scores[1].playerId;
                        } else {
                            console.log("game has been tied !!")
                            winner = "game tied !"
                        }
                        const result = { scores, winner };
                        // Notify both players of the final result.

                        gameManager.sessions[sessionKey].sockets.forEach(s => { s.emit('game:end', result) });
                        // Clean up the in-memory session.
                        delete gameManager.sessions[sessionKey];
                    }

                  
                }
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username}`);

            // Remove disconnected user from the waiting list.
            gameManager.waitingPlayers = gameManager.waitingPlayers.filter(p => p.userId !== socket.user.userId);
        });
    });

    async function createGameSession(player1, player2) {
        try {
            // Load 4 questions from the database.
            const questions = await QuestionModel.find().limit(4);
            if (questions.length < 4) {
                console.error("Not enough questions available to start the game.");
                return;
            }
            // Initialize scores for each player.
            const scoresMap = new Map();
            scoresMap.set(player1.userId.toString(), 0);
            scoresMap.set(player2.userId.toString(), 0);

            const currentUserQuestionsMap = new Map();
            currentUserQuestionsMap.set(player1.userId.toString(), 0);
            currentUserQuestionsMap.set(player2.userId.toString(), 0);

            // Create and save the game session.
            const gameSession = new GameSession({
                players: [player1.userId, player2.userId],
                questions,
                scores: scoresMap,
                currentUserQuestionsMap
            });
            await gameSession.save();

            // Store the session in the in-memory game manager.
            const sessionKey = gameSession._id.toString();
            gameManager.sessions[sessionKey] = {
                answersReceived: new Map([
                    [player1.userId.toString(), 0],
                    [player2.userId.toString(), 0]
                ]),
                sockets: [player1.socket, player2.socket]
            };

            // Emit the game initialization event to both players.
            const initData = {
                sessionId: gameSession._id,
                question: {
                    questionText: questions[0].questionText,
                    choices: questions[0].choices,
                    questionIndex: 0
                }
            };
          
            player1.socket.emit('game:init', initData);
            player2.socket.emit('game:init', initData);
        } catch (err) {
            console.error(err);
        }
    }
}