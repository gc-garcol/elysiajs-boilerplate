import 'reflect-metadata'
import cluster from 'node:cluster'
import os from 'node:os'
import process from 'node:process'
import { serverConfig } from './common/server.config';
import { logger } from './common/logger';

if (cluster.isPrimary) {
	for (let i = 0; i < Math.min(os.availableParallelism(), serverConfig.max_cores); i++) {
		cluster.fork();
	}
} else {
	await import('./server')
	logger.info(`Worker ${process.pid} started`)
}
