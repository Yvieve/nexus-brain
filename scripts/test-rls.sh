#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Only the current machine's managed local socket; no host ports or external DB.
nexus_docker=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock)
nexus_test_container="nexus-rls-test-${RANDOM}-$$"
trap '"${nexus_docker[@]}" rm -f "$nexus_test_container" >/dev/null 2>&1 || true' EXIT
"${nexus_docker[@]}" run -d --name "$nexus_test_container" --network none -e POSTGRES_PASSWORD=nexus-local-test postgres:16@sha256:f9a7b9ebf6f56201f949db745e47bc423c0f0f8294bafe991cc10bf74b029657 >/dev/null
nexus_ready=false
for nexus_attempt in {1..30}; do
 if "${nexus_docker[@]}" exec "$nexus_test_container" pg_isready -U postgres >/dev/null 2>&1; then nexus_ready=true;break;fi
 sleep 1
done
if [[ "$nexus_ready" != true ]]; then echo 'PostgreSQL test container did not become ready' >&2;exit 1;fi
"${nexus_docker[@]}" exec -i "$nexus_test_container" psql -U postgres -v ON_ERROR_STOP=1 < tests/rls-bootstrap.sql
"${nexus_docker[@]}" exec -i "$nexus_test_container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261110_department_skills.sql
"${nexus_docker[@]}" exec -i "$nexus_test_container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261111_ai_demo_quota.sql
# Repeat to validate additive migration idempotency.
"${nexus_docker[@]}" exec -i "$nexus_test_container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261110_department_skills.sql
"${nexus_docker[@]}" exec -i "$nexus_test_container" psql -U postgres -v ON_ERROR_STOP=1 < tests/rls-assertions.sql

"${nexus_docker[@]}" exec -i "$nexus_test_container" psql -U postgres -v ON_ERROR_STOP=1 < tests/ai-quota.sql
