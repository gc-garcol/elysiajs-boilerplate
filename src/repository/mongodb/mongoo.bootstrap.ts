import * as mongoose from "mongoose";
import { logger } from "../../common/logger";
import { serverConfig } from "../../common/server.config";

export const bootstrapMongoDB = async () => {
  await mongoose.connect(serverConfig.mongo_uri);
  logger.info('Connected to MongoDB');
}
