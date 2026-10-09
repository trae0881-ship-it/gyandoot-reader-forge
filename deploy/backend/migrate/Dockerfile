# One-shot job: applies every database migration to the Railway Postgres.
FROM postgres:15-alpine
COPY supabase/migrations /migrations
COPY deploy/backend/migrate/bootstrap.sql /bootstrap.sql
COPY deploy/backend/migrate/run.sh /run.sh
RUN chmod +x /run.sh
CMD ["/run.sh"]
