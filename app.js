const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayer = (dbResponse) => {
  return {
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
    *
    FROM
    player_details;
    `;
  const players = await db.all(getPlayersQuery);
  response.send(players.map((eachPlayer) => convertPlayer(eachPlayer)));
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
    *
    FROM
    player_details
    WHERE
    player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayer(player));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE
  player_details
  SET
  player_name = "${playerName}"
  WHERE
  player_id = ${playerId};
  `;
  const updatedPlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

const convertMatch = (dbResponse) => {
  return {
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  };
};

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    * 
    FROM 
    match_details
    WHERE
    match_id = ${matchId};
    `;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatch(matchDetails));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
    match_details.match_id AS matchId,
    match_details.match,
    match_details.year
    FROM
    (match_details INNER JOIN player_match_score 
        ON match_details.match_id = player_match_score.match_id)
    WHERE
    player_match_score.player_id = ${playerId};
    `;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(playerMatches);
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM
    (player_details INNER JOIN player_match_score 
        ON player_match_score.player_id = player_details.player_id)
    WHERE
    player_match_score.match_id = ${matchId};
    `;
  const matchPlayers = await db.all(getMatchPlayersQuery);
  response.send(matchPlayers);
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT
    player_details.player_id,
    player_details.player_name,
    SUM(player_match_score.score),
    SUM(player_match_score.fours),
    SUM(player_match_score.sixes)
    FROM
    (player_details INNER JOIN player_match_score
        ON player_match_score.player_id = player_details.player_id)
    WHERE 
    player_details.player_id = ${playerId};
    `;
  const playerScores = await db.get(getPlayerScoresQuery);
  //console.log(playerScores);
  response.send({
    playerId: playerScores["player_id"],
    playerName: playerScores["player_name"],
    totalScore: playerScores["SUM(player_match_score.score)"],
    totalFours: playerScores["SUM(player_match_score.fours)"],
    totalSixes: playerScores["SUM(player_match_score.sixes)"],
  });
});

module.exports = app;
