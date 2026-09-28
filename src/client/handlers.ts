import amqp from "amqplib";
import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/subscribe.js";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";

export function handlerPause(gs: GameState) {
  return async (ps: PlayingState) => {
    handlePause(gs, ps);
    process.stdout.write("> ");
    return AckType.Ack;
  };
}

export function handlerMove(gs: GameState, confirmChannel: amqp.ConfirmChannel) {
  return async (mv: ArmyMove) => {
    try {
      const outcome = handleMove(gs, mv);
      switch (outcome) {
        case MoveOutcome.MakeWar: {
          try {
            await publishJSON(
              confirmChannel,
              ExchangePerilTopic,
              `${WarRecognitionsPrefix}.${gs.getUsername()}`,
              { attacker: mv.player, defender: gs.getPlayerSnap() },
            );
            return AckType.Ack;
          } catch {
            return AckType.NackRequeue;
          }
        }
        case MoveOutcome.Safe:
          return AckType.Ack;
        case MoveOutcome.SamePlayer:
        default:
          return AckType.NackDiscard;
      }
    } finally {
      process.stdout.write("> ");
    }
  };
}

export function handlerWar(gs: GameState) {
  return async (rw: RecognitionOfWar) => {
    try {
      const resolution = handleWar(gs, rw);
      switch (resolution.result) {
        case WarOutcome.NotInvolved:
          return AckType.NackRequeue;
        case WarOutcome.NoUnits:
          return AckType.NackDiscard;
        case WarOutcome.Draw:
        case WarOutcome.OpponentWon:
        case WarOutcome.YouWon:
          return AckType.Ack;
        default:
          console.log("Error! Invalid war resolution!");
          return AckType.NackDiscard;
      }
    } finally {
      process.stdout.write("> ");
    }
  };
}
