import amqp from "amqplib";
import {
  clientWelcome,
  commandStatus,
  getInput,
  printClientHelp,
  printQuit,
} from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { subscribeJSON } from "../internal/pubsub/subscribe.js";
import { handlerPause } from "./handlers.js";

const connStr = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril client...");
  const connection = await amqp.connect(connStr);
  console.log("Connected to RabbitMQ");

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    connection.close();
  });

  const username = await clientWelcome();
  declareAndBind(
    connection,
    ExchangePerilDirect,
    `${PauseKey}.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
  );

  const state = new GameState(username);
  await subscribeJSON(
    connection,
    ExchangePerilDirect,
    `${PauseKey}.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
    handlerPause(state),
  );

  while (true) {
    const inputArr = await getInput();
    if (inputArr.length) {
      const command = inputArr[0];
      // spawn, move, status, help, spam, quit
      if (command === "spawn") {
        try {
          commandSpawn(state, inputArr);
        } catch (error) {
          console.log(error);
        }
      } else if (command === "move") {
        try {
          commandMove(state, inputArr);
          console.log("Move successful!");
        } catch (error) {
          console.log(error);
        }
      } else if (command === "status") {
        commandStatus(state);
      } else if (command === "spam") {
        console.log("Spamming not allowed yet!");
      } else if (command === "quit") {
        printQuit();
        process.exit(0);
      } else if (command === "help") {
        printClientHelp();
      } else {
        console.log("Invalid command!");
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
