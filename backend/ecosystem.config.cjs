module.exports = {
  apps: [
    {
      name: "orbit-cluster",
      script: "src/cluster.js",
      instances: 1, // cluster.js handles multi-core CPU workers internally via cluster.SCHED_RR
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: 5001,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5001,
      },
      max_memory_restart: "500M",
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
