// pm2 start pm2.config.cjs
// pm2 delete pm2.config.cjs

module.exports = {
  apps: [
    {
      name: "elysia server",
      script: "index",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      autorestart: false,
      max_memory_restart: "500M",
      env: {
        MAX_CORES: "2"
      }
    },
  ]
};
