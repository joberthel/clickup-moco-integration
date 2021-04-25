import { URL } from 'url';
import fetch from 'node-fetch';
import { CLICKUP_ID, CLICKUP_SECRET } from '../environment';

const API_BASE = 'https://api.clickup.com/api/v2';

export interface ClickupUser {
    id: number;
    username: string;
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
