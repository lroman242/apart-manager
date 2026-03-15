.PHONY: env_prod env_local run_dev run_prod lint migration migrate function deploy logs db_reset db_diff db_pull status

env_prod:
	@[ -f .env ] || cp .env.example .env

env_local:
	@[ -f .env.local ] || cp .env.example .env.local

run_dev:
	docker compose up app

run_prod:
	docker compose up --build prod -d

lint:
	npm run lint

migration:
	supabase migration new $(name)

migrate:
	supabase db push

function:
	supabase functions new $(name)

deploy:
	supabase functions deploy apartments-create --no-verify-jwt
	supabase functions deploy apartments-update --no-verify-jwt
	supabase functions deploy apartments-delete --no-verify-jwt
	supabase functions deploy apartments-set-status --no-verify-jwt
	supabase functions deploy tariffs-create --no-verify-jwt
	supabase functions deploy tariffs-update --no-verify-jwt
	supabase functions deploy tariffs-delete --no-verify-jwt
	supabase functions deploy readings-create --no-verify-jwt
	supabase functions deploy readings-update --no-verify-jwt

logs:
	supabase functions logs $(name) --tail

db_reset:
	supabase db reset

db_diff:
	supabase db diff -f $(name)

db_pull:
	supabase db pull

status:
	supabase status
