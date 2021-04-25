import { URL } from 'url';
import fetch from 'node-fetch';
import { CLICKUP_ID, CLICKUP_SECRET, HOST } from '../environment';

const API_BASE = 'https://api.clickup.com/api/v2';

export interface ClickupUser {
    id: number;
    username: string;
}

export interface ClickupTeam {
    id: number;
    name: string;
}

export interface ClickupWebhook {
    id: string;
    userid: number;
    team_id: number;
    endpoint: string;
    client_id: string;
    events: string[];
    health: {
        status: string;
        fail_count: number;
    };
    secret: string;
}

export interface ClickupTimeEntry {
    id: string;
    task: ClickupTask
    user: ClickupUser;
    billable: boolean;
    duration: string;
    description: string;
    tags: string[];
}

export interface ClickupTask {
    id: string;
    custom_id?: string;
    name: string;
    url: string;
    list: { id: string; name: string; access: boolean};
    folder: {
        id: string;
        name: string;
        hidden: boolean;
        access: boolean;
    }
}

export const getToken = async (code: string): Promise<string> => {
    const url = new URL(`${API_BASE}/oauth/token`);
    url.searchParams.append('client_id', CLICKUP_ID);
    url.searchParams.append('client_secret', CLICKUP_SECRET);
    url.searchParams.append('code', code);

    const response = await fetch(url, {
        method: 'post'
    });

    const json = await response.json();
    return json.access_token;
};

export const getUser = async (token: string): Promise<ClickupUser> => {
    const response = await fetch(`${API_BASE}/user`, {
        headers: {
            Authorization: token
        }
    });

    const json = await response.json();
    return json.user;
};

export const getTeams = async (token: string): Promise<ClickupTeam[]> => {
    const response = await fetch(`${API_BASE}/team`, {
        headers: {
            Authorization: token
        }
    });

    const json = await response.json();
    return json.teams;
};

export const getWebhooks = async (token: string, team: number): Promise<ClickupWebhook[]> => {
    const response = await fetch(`${API_BASE}/team/${team}/webhook`, {
        headers: {
            Authorization: token
        }
    });

    const json = await response.json();
    return json.webhooks;
};

export const createWebhooks = async (token: string): Promise<ClickupWebhook[]> => {
    const teams = await getTeams(token);
    const endpoint = `${HOST}/api/webhook/track`;

    const webhooks: ClickupWebhook[] = [];

    for (const team of teams) {
        let webhook = (await getWebhooks(token, team.id)).find(webhook => webhook.endpoint === endpoint);

        if (typeof webhook === 'undefined') {
            const response = await fetch(`${API_BASE}/team/${team.id}/webhook`, {
                method: 'post',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint,
                    events: ['taskTimeTrackedUpdated']
                })
            });

            const json = await response.json();
            webhook = json.webhook as ClickupWebhook;
        }

        webhooks.push(webhook);
    }

    return webhooks;
};

export const getTimeEntry = async (token: string, team: number, timer: string): Promise<ClickupTimeEntry|false> => {
    const response = await fetch(`${API_BASE}/team/${team}/time_entries/${timer}`, {
        headers: {
            Authorization: token
        }
    });

    const json = await response.json();
    return json.data;
};

export const getTask = async (token: string, task: string): Promise<ClickupTask|false> => {
    const response = await fetch(`${API_BASE}/task/${task}`, {
        headers: {
            Authorization: token
        }
    });

    const json = await response.json();
    return json;
};
