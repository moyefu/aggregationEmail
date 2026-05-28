#!/bin/sh

set -e

echo "[INFO] Preparing database..."

SCHEMA_PATH="/app/prisma/schema.prisma"
DATABASE_URL="${DATABASE_URL:-file:/app/data/dev.db}"

detect_provider() {
    case "$DATABASE_URL" in
        file:*)
            echo "sqlite"
            ;;
        mysql://*)
            echo "mysql"
            ;;
        postgresql://*|postgres://*)
            echo "postgresql"
            ;;
        *)
            echo "sqlite"
            ;;
    esac
}

get_current_provider() {
    sed -n '/datasource db/,/}/p' "$SCHEMA_PATH" | grep -o 'provider\s*=\s*"[^"]*"' | sed 's/provider\s*=\s*"\([^"]*\)"/\1/'
}

update_schema() {
    PROVIDER=$(detect_provider)
    CURRENT_PROVIDER=$(get_current_provider)
    
    if [ "$CURRENT_PROVIDER" != "$PROVIDER" ]; then
        echo "[INFO] Database type change detected: $CURRENT_PROVIDER -> $PROVIDER"
        
        sed -i "/datasource db/,/}/s/provider\s*=\s*\"[^\"]*\"/provider = \"$PROVIDER\"/" "$SCHEMA_PATH"
        
        if [ "$PROVIDER" = "sqlite" ]; then
            sed -i 's/\s*@db\.\w*\(\(\d*\)\)\?//g' "$SCHEMA_PATH"
        elif [ "$PROVIDER" = "mysql" ]; then
            if ! grep -q "smtpPassword String.*@db.Text" "$SCHEMA_PATH"; then
                sed -i 's/smtpPassword String/smtpPassword String     @db.Text/' "$SCHEMA_PATH"
            fi
        elif [ "$PROVIDER" = "postgresql" ]; then
            sed -i 's/\s*@db\.\w*\(\d*\)//g' "$SCHEMA_PATH"
            if ! grep -q "smtpPassword String.*@db.Text" "$SCHEMA_PATH"; then
                sed -i 's/smtpPassword String/smtpPassword String     @db.Text/' "$SCHEMA_PATH"
            fi
        fi
        
        echo "[INFO] schema.prisma updated"
    fi
}

update_schema

echo "[INFO] Generating Prisma Client..."
./node_modules/.bin/prisma generate
echo "[INFO] Prisma Client generated"

echo "[INFO] Syncing database..."
./node_modules/.bin/prisma db push --skip-generate
echo "[INFO] Database synced"

if [ -f /app/scripts/start-smtp.js ]; then
    echo "[INFO] Starting SMTP service..."
    node /app/scripts/start-smtp.js &
fi

echo "[INFO] Starting Next.js server..."
exec node server.js