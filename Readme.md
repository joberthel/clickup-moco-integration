# clickup-moco-integration

**Disclaimer**: This project is in an early development state, but should already be usable in production. Use at your own risk!

This projects aims to connect the time tracking features of [ClickUp](https://clickup.com/) and [MOCO](https://www.mocoapp.com/). It basically syncs the time entries from a ClickUp task to the activities inside MOCO.

## Automatic task selection in MOCO

First it will search for a previous activity on the same ClickUp task (same user) in the last 7 days. If it finds something, than it will track the time on the same MOCO task.

If no activity was found, than it will select a task with a similar name. It looks for project (MOCO), company (MOCO), folder (ClickUp) and list (ClickUp).

## Installation

You can follow [this tutorial](https://docs.clickup.com/en/articles/2171168-api-create-your-own-app) to create an app inside your ClickUp instance.

After everything is setup correctly you can open your browser at `{DOMAIN}/login`. You should get redirected to the ClickUp oAuth flow. Then you will need no enter your private API key from MOCO. Every user of your team, who wants to use this integration, needs to follow that procedure.

## Deployment

This project contains an example docker-compose setup, which you can use as a starting point. To get started you will only need to create a .env file with your configuration parameters.

```
$ docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

## Development

For local development you can also use the provided docker-compose setup. But to make the webhook work together with ClickUp you will need to use something like [localtunnel](https://github.com/localtunnel/localtunnel).

```
$ docker-compose up
```
