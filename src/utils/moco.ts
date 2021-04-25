import fetch from 'node-fetch';
import { MOCO_SUBDOMAIN } from '../environment';

const API_BASE = `https://${MOCO_SUBDOMAIN}.mocoapp.com/api/v1`;

export const validate = async (key: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/session`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    return response.status == 200;
};
