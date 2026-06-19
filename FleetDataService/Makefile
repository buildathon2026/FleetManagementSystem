.PHONY: setup build run dev seed clean

# Install dependencies
setup:
	npm install

# Compile TypeScript
build:
	npx tsc

# Start production server (requires build first)
run:
	node dist/index.js

# Start development server with auto-reload
dev:
	npx ts-node-dev --respawn --transpile-only src/index.ts

# Re-seed the database (drops and recreates data)
seed:
	npx ts-node src/seed.ts

# Clean build artifacts, dependencies, and database
clean:
	rm -rf node_modules dist fleet.db
