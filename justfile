set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

export PATH := `echo "$HOME/.local/share/vite-plus/bin:$PATH"`

dev:
    vp dev

check:
    vp check && vp test && vp build

deploy:
    vp exec wrangler deploy

db-migrate:
    vp exec wrangler d1 migrations apply DB --local

db-migrate-remote:
    vp exec wrangler d1 migrations apply DB --remote

db-seed:
    vp exec wrangler d1 execute DB --local --file=scripts/seed.sql

db-seed-remote:
    vp exec wrangler d1 execute DB --remote --file=scripts/seed.sql
