pipeline {
  agent any

  parameters {
    string(name: 'DEPLOY_DIR', defaultValue: '', description: 'Folder on server that contains docker-compose.yml + .env + source. Leave empty to use Jenkins WORKSPACE.')
    string(name: 'ENV_FILE', defaultValue: '', description: 'Absolute path to .env on server (fallback). Can also be a folder; will use <folder>/.env.')
    string(name: 'APP_NAME', defaultValue: 'vtc-rnd-ranking', description: 'Docker compose project name')
    string(name: 'PORT', defaultValue: '7070', description: 'Host port mapped to container port 3000')
  }

  environment {
    DOCKER_BUILDKIT = '1'
  }

  options {
    timestamps()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Docker Compose Up') {
      steps {
        sh '''
          set -eu

          echo "WORKSPACE=${WORKSPACE:-<unset>}"
          pwd

          # Run compose in DEPLOY_DIR if provided; otherwise use Jenkins WORKSPACE.
          RUN_DIR="${DEPLOY_DIR:-}"
          if [ -z "$RUN_DIR" ]; then
            RUN_DIR="${WORKSPACE:-}"
          fi

          if [ -z "$RUN_DIR" ]; then
            echo "Missing RUN_DIR. Jenkins did not provide WORKSPACE and DEPLOY_DIR is empty."
            exit 2
          fi

          if [ -n "${DEPLOY_DIR:-}" ] && [ ! -d "$DEPLOY_DIR" ]; then
            echo "DEPLOY_DIR not found or not accessible: $DEPLOY_DIR"
            RUN_DIR="${WORKSPACE:-}"
            echo "Falling back to WORKSPACE: $RUN_DIR"
          fi

          if [ ! -d "$RUN_DIR" ]; then
            echo "RUN_DIR not found: $RUN_DIR"
            exit 2
          fi
          if [ ! -f "$RUN_DIR/docker-compose.yml" ]; then
            echo "docker-compose.yml not found in RUN_DIR: $RUN_DIR"
            exit 2
          fi

          # Optional: point env_file to a server .env via ENV_FILE (docker-compose.yml uses: ${ENV_FILE:-.env})
          if [ -n "${ENV_FILE:-}" ] && [ -d "$ENV_FILE" ]; then
            ENV_FILE="$ENV_FILE/.env"
          fi
          if [ -n "${ENV_FILE:-}" ] && [ ! -f "$ENV_FILE" ]; then
            echo "ENV_FILE not found: $ENV_FILE"
            exit 2
          fi

          cd "$RUN_DIR"

          APP_NAME_VALUE="${APP_NAME:-vtc-rnd-ranking}"
          PORT_VALUE="${PORT:-7070}"

          if [ -n "${ENV_FILE:-}" ]; then
            PORT="$PORT_VALUE" ENV_FILE="$ENV_FILE" docker compose -p "$APP_NAME_VALUE" -f docker-compose.yml up -d --build --remove-orphans
          else
            PORT="$PORT_VALUE" docker compose -p "$APP_NAME_VALUE" -f docker-compose.yml up -d --build --remove-orphans
          fi

          docker compose -p "$APP_NAME_VALUE" -f docker-compose.yml ps
        '''.stripIndent()
      }
    }
  }
}
