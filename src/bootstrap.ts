import { GameLanguage } from "./model/game/game";
import { GameJson } from "./model/game/game.external-resource";
import { gameService } from "./services/game.service";
import { initializeSchema } from "./repository/sqlite";
import { bootstrapMongoDB } from "./repository/mongodb";


export const bootstrap = async () => {
  await bootstrapMongoDB();
}