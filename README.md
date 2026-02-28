# TeslaMate Discord Reporter

This service runs alongside [TeslaMate](https://github.com/teslamate-org/teslamate) and sends real-time alerts and weekly reports directly to your Discord.

## Setup
1. Follow the [Discord Bot Setup Guide](discord-setup/README.md) to create your bot and get the tokens.
2. Form your `config.json` filling in your Discord Token and User ID, as well as MQTT and Postgres parameters.

## Adding to TeslaMate `docker-compose.yml`

Add this block under the `services` section of your TeslaMate `docker-compose.yml`:

```yaml
  teslamate-discord-reporter:
    image: ghcr.io/bogosj/teslamate-reporting:main
    restart: always
    depends_on:
      - database
      - mosquitto
    volumes:
      # Remember to map your local config file onto the container's config.json
      - ./discord-config.json:/usr/src/app/config.json:ro
```

## Manual Testing
If you would like to force the weekly report to compile and send immediately (for testing out your configuration), you can run this command against your docker container:

```bash
docker exec -it <name_of_the_reporter_container> node src/trigger-report.js
```