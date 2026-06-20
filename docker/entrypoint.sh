#!/usr/bin/env sh
set -e

case "${1:-api}" in
    api)
        exec uvicorn fosslove.main:app --host 0.0.0.0 --port 8000
        ;;
    worker)
        exec saq fosslove.worker.settings.settings
        ;;
    migrate)
        exec alembic upgrade head
        ;;
    *)
        exec "$@"
        ;;
esac
