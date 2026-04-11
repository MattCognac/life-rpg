# Self-Hosting Life RPG

Running Life RPG on a home server, VPS, Raspberry Pi, or any box you control. **Read the security section before exposing this to the internet.**

---

## ⚠️ Security Reality Check

**Life RPG has no authentication.** It assumes whoever can reach the app is the single legitimate user. This is fine for localhost. It is NOT fine for a public URL without additional protection.

If you expose the app without auth:
- Anyone on the internet can see, create, complete, and delete your quests
- Anyone can hit the AI chain generator, draining your Anthropic API credits (rate-limited to 15/hour, but that's still ~$3/hour of someone else's fun at your expense)
- There's no audit trail of who did what

**You have three acceptable deployment shapes:**

1. **Localhost only** — run `npm run dev` on your machine. Done.
2. **Tailscale / WireGuard / ZeroTier** — expose only to your private mesh. No public URL, no auth needed. This is what I do.
3. **Public URL behind a reverse proxy with HTTP basic auth** — see the Caddy/nginx examples below.

Do NOT stick it on a public IP with no auth. The "it's just me" defense stops working the moment a scraper finds it.

---

## Option 1: Localhost / LAN

The simplest deployment. Build once, start with `npm start`, access from any device on your LAN via the host machine's IP.

```bash
# On the host machine
npm install
cp .env.example .env
# Add ANTHROPIC_API_KEY if you want AI chain generation
npm run db:migrate
npm run db:seed           # optional — sample data
npm run build
npm start                 # listens on localhost:3000 by default
```

To bind to your LAN instead of localhost only:

```bash
# Listen on all interfaces (use this ONLY on a trusted LAN)
HOSTNAME=0.0.0.0 npm start
```

Then access from other devices via `http://<your-machine-ip>:3000`.

**Don't do this on hotel wifi, coffee shops, or any untrusted network.** Anyone on the same LAN can access your quests and trigger AI generation against your API key.

---

## Option 2: Tailscale / Private Mesh (Recommended)

This is my preferred setup. Zero public exposure, no auth needed, works from anywhere I'm logged into my mesh.

1. Install [Tailscale](https://tailscale.com/) on the host and on every device you want to access it from
2. Run Life RPG bound to `0.0.0.0` as above
3. Access via `http://<host-tailscale-hostname>:3000` from any device in your tailnet
4. Optionally put it behind a tailnet-local Caddy with a friendly hostname (`liferpg.ts.net`)

Wireguard or ZeroTier work identically.

---

## Option 3: Public URL with Reverse Proxy + Basic Auth

If you really want a public URL — don't skip the auth step.

### Caddy (easiest)

`Caddyfile`:

```caddy
liferpg.example.com {
    basicauth {
        # Generate with: caddy hash-password
        # Replace "mypassword" with your real password first
        yourname $2a$14$...bcrypt-hash-goes-here...
    }

    reverse_proxy localhost:3000
}
```

Caddy auto-handles HTTPS via Let's Encrypt. One command to start:

```bash
caddy run --config Caddyfile
```

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name liferpg.example.com;

    ssl_certificate     /etc/letsencrypt/live/liferpg.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/liferpg.example.com/privkey.pem;

    auth_basic "Life RPG";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $proxy_scheme;
    }
}
```

Generate the password file:

```bash
htpasswd -c /etc/nginx/.htpasswd yourname
```

---

## Running as a systemd Service

`/etc/systemd/system/liferpg.service`:

```ini
[Unit]
Description=Life RPG
After=network.target

[Service]
Type=simple
User=liferpg
WorkingDirectory=/opt/liferpg
EnvironmentFile=/opt/liferpg/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
# Only listen on localhost — the reverse proxy handles external traffic
Environment=HOSTNAME=127.0.0.1
Environment=PORT=3000
# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/liferpg/prisma

[Install]
WantedBy=multi-user.target
```

```bash
# Create user
sudo useradd -r -m -d /opt/liferpg liferpg

# Deploy code
sudo -u liferpg git clone <your-repo> /opt/liferpg
cd /opt/liferpg
sudo -u liferpg npm install
sudo -u liferpg cp .env.example .env
# Edit .env
sudo -u liferpg npm run build
sudo -u liferpg npm run db:migrate
sudo -u liferpg npm run db:seed  # if desired

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable --now liferpg
sudo systemctl status liferpg
```

---

## Backups

**Your character, quests, and history all live in a single file: `prisma/dev.db`.** If you lose it, you lose everything. Back it up.

### Manual

```bash
npm run db:backup
```

This runs `scripts/backup.sh` which creates a timestamped copy in `prisma/backups/` (keeps the 20 most recent). If `sqlite3` is installed on the host, it uses the safe `.backup` command; otherwise it falls back to `cp`.

### Automated (cron)

Back up hourly:

```cron
# crontab -e
0 * * * * cd /opt/liferpg && /opt/liferpg/scripts/backup.sh >> /opt/liferpg/prisma/backup.log 2>&1
```

### Off-site

`prisma/backups/` lives on the same disk as your database. That's not a real backup. Also sync to something else:

```bash
# rclone to Backblaze B2, S3, Dropbox, etc.
rclone sync /opt/liferpg/prisma/backups/ remote:liferpg-backups/

# Or just rsync to another host
rsync -avz /opt/liferpg/prisma/backups/ backup-host:/backups/liferpg/
```

### Restore

```bash
# Stop the app
sudo systemctl stop liferpg

# Replace the live DB with a backup
cp prisma/backups/dev_20260410_152332.db prisma/dev.db

# Start again
sudo systemctl start liferpg
```

---

## Updating

```bash
cd /opt/liferpg
sudo systemctl stop liferpg
sudo -u liferpg git pull
sudo -u liferpg npm install
sudo -u liferpg npm run build
sudo -u liferpg npm run db:deploy   # applies any new migrations
sudo systemctl start liferpg
```

**Always back up before updating** if you have real character data. Migrations should be safe but bugs happen.

---

## Monitoring

For a personal project, formal monitoring is overkill. But two cheap additions are worth it:

### Health check (poor man's uptime monitoring)

Add a simple `curl` to cron that pings the dashboard and alerts you if it stops responding:

```bash
*/5 * * * * curl -fs http://localhost:3000/ > /dev/null || echo "liferpg down" | mail -s "Life RPG" you@example.com
```

### Log watching

`journalctl -u liferpg -f` if you're running under systemd.

---

## Resource Usage

Life RPG is small. On my Raspberry Pi 4:
- **RAM**: ~100 MB idle, ~180 MB under load
- **Disk**: ~200 MB for `node_modules`, <1 MB for the database (even after months of use)
- **CPU**: negligible — spikes briefly when Claude is thinking during AI chain generation, otherwise near-zero

SQLite is the right choice. You don't need Postgres for this.

---

## Troubleshooting

**"ANTHROPIC_API_KEY is not set" error on the AI generator**
- Add it to `.env` and restart the server. Env vars are validated at startup.

**Database locked errors**
- SQLite allows one writer at a time. If you left `prisma studio` open, close it.

**"Migration drift detected"**
- You modified `schema.prisma` without creating a migration. Run `npm run db:migrate` to create one.
- If you manually edited the DB and it's out of sync, back up first, then `npx prisma migrate resolve`.

**Level or XP looks wrong after deleting a quest**
- XP refund and achievement reconciliation run automatically. If something looks off, check the activity feed on the dashboard for the sequence of events.
- If you truly need to recompute from scratch, you can restore from a backup — there's no "recompute all XP from completion history" utility yet.

---

## Things I'd Add If This Were a Real Product

These are NOT implemented. If you're forking this to deploy multi-user, these are the holes to fill first:

- Real authentication (auth.js, Clerk, Auth0, or roll your own with sessions)
- Per-user `userId` foreign keys on every table
- Input validation with Zod on every server action (currently most trust the types)
- Request logging + error tracking (Sentry, Betterstack, Axiom)
- Rate limiting on non-AI endpoints too
- Database migration safety checks in CI
- Automated tests for XP math, achievement conditions, chain unlock logic
- Per-user Anthropic API keys (or metered usage with a central key)

For single-user self-hosting, none of these are necessary.
