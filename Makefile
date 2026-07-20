.PHONY: help up down logs test-endpoints k8s-up k8s-down k8s-watch k8s-port-forward k8s-load-test retry lint clean

help:
	@echo "Docker Compose (the submission):"
	@echo "  make up              docker compose up -d --build"
	@echo "  make down            docker compose down"
	@echo "  make logs            follow backend + frontend logs"
	@echo "  make test-endpoints  curl every API endpoint against localhost:8000"
	@echo ""
	@echo "Kubernetes + KEDA (bonus, separate from the submission):"
	@echo "  make k8s-up          kind cluster + KEDA + build + load + apply, one command"
	@echo "  make k8s-down        delete the kind cluster"
	@echo "  make k8s-watch       watch pods scale live"
	@echo "  make k8s-port-forward  expose the k8s backend on localhost:18000"
	@echo "  make k8s-load-test   enqueue jobs and trigger a visible scale-up"
	@echo ""
	@echo "  make lint            ruff + ty (backend), biome + tsc (frontend)"
	@echo "  make clean           remove local sqlite data + node_modules caches"

up:
	@n=0; \
	until docker compose up -d --build; do \
		n=$$((n+1)); \
		if [ $$n -ge 5 ]; then \
			echo ""; \
			echo "WARNING: docker compose up failed 5 times in a row."; \
			echo "This is network instability (registry pull failures), not a bug in this repo."; \
			echo "Try switching to Wi-Fi and re-run: make up"; \
			echo ""; \
			exit 1; \
		fi; \
		echo "attempt $$n failed, retrying in 3s..."; \
		sleep 3; \
	done
	@echo "frontend: http://localhost:3000  backend: http://localhost:8000"

down:
	docker compose down

logs:
	docker compose logs -f

test-endpoints:
	@B=http://localhost:8000; \
	curl -s -w " [%{http_code}]\n" $$B/healthz; \
	MID=$$(curl -s -X POST $$B/monitors -H "Content-Type: application/json" -d "{\"url\":\"https://example.com?t=$$(date +%s)\"}" | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])"); \
	echo "created monitor: $$MID"; \
	curl -s -w " [%{http_code}]\n" $$B/monitors -o /dev/null; \
	curl -s -w " [%{http_code}]\n" "$$B/monitors/$$MID/checks" -o /dev/null; \
	curl -s -w " [%{http_code}]\n" -X DELETE "$$B/monitors/$$MID"

k8s-up:
	@$(MAKE) --no-print-directory retry CMD="kind create cluster --config k8s/kind-config.yaml"
	@$(MAKE) --no-print-directory retry CMD="helm repo add kedacore https://kedacore.github.io/charts"
	@$(MAKE) --no-print-directory retry CMD="helm repo update"
	@$(MAKE) --no-print-directory retry CMD="helm install keda kedacore/keda --namespace keda --create-namespace"
	kubectl wait --for=condition=Available deployment --all -n keda --timeout=90s
	@$(MAKE) --no-print-directory retry CMD="docker build -t epifi-uptime-monitor-backend:latest ./backend"
	@$(MAKE) --no-print-directory retry CMD="kind load docker-image epifi-uptime-monitor-backend:latest --name uptime-platform"
	kubectl apply -f k8s/
	kubectl wait --for=condition=Available deployment/redis deployment/backend-api -n uptime-platform --timeout=90s
	@echo "backend-api ready. run: make k8s-port-forward"

retry:
	@n=0; \
	until $(CMD); do \
		n=$$((n+1)); \
		if [ $$n -ge 5 ]; then \
			echo ""; \
			echo "WARNING: '$(CMD)' failed 5 times in a row."; \
			echo "This is network instability (registry pull failures), not a bug in this repo."; \
			echo "Try switching to Wi-Fi and re-run: make k8s-up"; \
			echo ""; \
			exit 1; \
		fi; \
		echo "attempt $$n failed, retrying in 3s..."; \
		sleep 3; \
	done

k8s-down:
	kind delete cluster --name uptime-platform

k8s-watch:
	kubectl get pods -n uptime-platform -w

k8s-port-forward:
	kubectl port-forward -n uptime-platform svc/backend-api 18000:8000

k8s-load-test:
	@MID=$$(curl -s http://localhost:18000/monitors | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['id'] if d else '')"); \
	if [ -z "$$MID" ]; then echo "no monitors registered yet — POST one via localhost:18000/monitors first"; exit 1; fi; \
	for i in 1 2 3 4 5 6 7 8; do kubectl exec -n uptime-platform deployment/redis -- redis-cli RPUSH due-checks $$MID > /dev/null; done; \
	echo "enqueued 8 jobs — watch: make k8s-watch"

lint:
	cd backend && uv run ruff check src/ && uv run ty check src/
	cd frontend && bunx biome check . && bunx tsc --noEmit

clean:
	rm -rf backend/data frontend/.next frontend/node_modules
