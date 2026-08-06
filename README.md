# Player Listing

Shows connected/max Minecraft players below Network (Outbound) on the server console.

Only reads Pterodactyl server/allocation data and pings the server's own game port
(Minecraft Server List Ping — the same handshake a vanilla client uses to show player
count in its multiplayer list). No RCON, no query protocol, no writes. Servers whose
egg doesn't expose a `SERVER_JARFILE` variable (i.e. not a standard Minecraft egg) never
render the block, so other games' panels are untouched.

## Installation

1. Drop `playerlisting.blueprint` into your Pterodactyl root folder (usually `/var/www/pterodactyl/`).
2. Run:

   ```bash
   blueprint -i playerlisting
   ```

## Removal

```bash
blueprint -r playerlisting
```
