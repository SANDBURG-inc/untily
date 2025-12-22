/**
 * PM2 Ecosystem Configuration
 * AWS EC2 t2.xlarge (4 vCPU, 16GB RAM) 최적화 설정
 *
 * 사용법:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: 'untily',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',

      // 클러스터 모드 설정 (t2.xlarge: 4 vCPU)
      instances: 4,
      exec_mode: 'cluster',

      // 무중단 배포를 위한 설정
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // 환경 변수
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 로그 설정
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 자동 재시작 설정
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,

      // 파일 감시 (프로덕션에서는 비활성화)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', '.next'],

      // 헬스체크 및 모니터링
      exp_backoff_restart_delay: 100,
      autorestart: true,
    },
  ],
};
