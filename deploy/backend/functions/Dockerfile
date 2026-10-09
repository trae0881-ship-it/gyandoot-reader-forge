# Edge functions runtime for Railway (build context = repo root).
FROM supabase/edge-runtime:v1.67.4
COPY supabase/functions /home/deno/functions
COPY deploy/backend/functions/main /home/deno/functions/main
ENV PORT=9000
EXPOSE 9000
CMD ["sh", "-c", "edge-runtime start --main-service /home/deno/functions/main --port ${PORT}"]
