import fetch from 'node-fetch';
import { ClickupTask, ClickupTimeEntry } from './clickup';
import { MOCO_SUBDOMAIN } from '../environment';
import stringSimilarity from 'string-similarity';

const API_BASE = `https://${MOCO_SUBDOMAIN}.mocoapp.com/api/v1`;

export interface MocoProject {
    id: number;
    identifier: string;
    name: string;
    active: boolean;
    billable: boolean;
    customer: MocoCustomer;
    tasks: MocoTask[];
}

export interface MocoCustomer {
    id: number;
    name: string;
}

export interface MocoTask {
    id: number;
    name: string;
    active: boolean;
    billable: boolean;
}

export const validate = async (key: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/session`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    return response.status == 200;
};

export const getAssignedProjects = async (key: string): Promise<MocoProject[]> => {
    const response = await fetch(`${API_BASE}/projects/assigned?active=true`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    return await response.json();
};

export const trackClickupTask = async (key: string, clickupTask: ClickupTask, timeEntry: ClickupTimeEntry): Promise<void> => {
    // TODO: check if time for this ticket was already tracked on a specific task -> try track on that task

    // collect moco projects
    const similarMatch = await findProjectTaskBySimilarity(key, clickupTask, timeEntry)

    if (similarMatch !== false) {
        await fetch(`${API_BASE}/activities`, {
            method: 'post',
            headers: {
                'Authorization': `Token token=${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: `${new Date().toISOString().slice(0, 10)}`,
                description: timeEntry.description || clickupTask.name,
                billable: timeEntry.billable,
                tag: clickupTask.custom_id || clickupTask.id,
                remote_service: 'clickup',
                remote_id: clickupTask.id,
                remote_url: clickupTask.url,
                project_id: similarMatch.project,
                task_id: similarMatch.task,
                hours: parseInt(timeEntry.duration) / 3600000
            })
        });
    }
};

const findProjectTaskBySimilarity = async (
    key: string,
    clickupTask: ClickupTask,
    timeEntry: ClickupTimeEntry
): Promise<{ project: number; task: number } | false> => {
    const projects = (await getAssignedProjects(key)).filter(project => project.active).filter(project => project.tasks.filter(task => task.active).length > 0);
    if (projects.length == 0) return false;

    const projectCombinations = [projects.map(project => project.name), projects.map(project => project.customer.name)];
    const projectMatch = findMatch([clickupTask.folder.name, clickupTask.list.name], projectCombinations);

    if (typeof projectMatch !== 'undefined') {
        const project = projects[projectMatch.bestMatchIndex];
        const tasks = project.tasks.filter(task => task.active);

        const taskMatch = findMatch(
            [clickupTask.folder.name, clickupTask.list.name, timeEntry.description || clickupTask.name],
            [tasks.map(task => task.name)]
        );

        if (typeof taskMatch !== 'undefined') {
            const task = tasks[taskMatch.bestMatchIndex];

            return {
                project: project.id,
                task: task.id
            };
        }
    }

    return false;
};

const findMatch = (needle: string[], haystack: string[][]): stringSimilarity.BestMatch | undefined => {
    let bestMatch: stringSimilarity.BestMatch | undefined = undefined;

    for (const a of needle) {
        for (const b of haystack) {
            const match = stringSimilarity.findBestMatch(a, b);

            if (typeof bestMatch === 'undefined' || match.bestMatch.rating > bestMatch.bestMatch.rating) {
                bestMatch = match;
            }
        }
    }

    return bestMatch;
};
