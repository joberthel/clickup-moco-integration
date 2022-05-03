import fetch from 'node-fetch';
import { FastifyLoggerInstance } from 'fastify';
import stringSimilarity from 'string-similarity';
import { ClickupTask, ClickupTimeEntry } from './clickup';
import { MOCO_SUBDOMAIN, MOCO_TASK_HISTORY } from '../environment';

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

export interface MocoActivity {
    tag: string;
    remote_id: string;
    remote_service: string;
    created_at: string;
    project: MocoProject;
    task: MocoTask;
}

export const validate = async (key: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/session`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    return response.status == 200;
};

export const getUserId = async (key: string): Promise<number> => {
    const response = await fetch(`${API_BASE}/session`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    const json = await response.json();
    return json.id;
};

export const getAssignedProjects = async (key: string): Promise<MocoProject[]> => {
    const response = await fetch(`${API_BASE}/projects/assigned?active=true`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    return await response.json();
};

export const getProject = async (key: string, project: number): Promise<MocoProject> => {
    const response = await fetch(`${API_BASE}/projects/${project}`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    return await response.json();
};

export const getActivities = async (key: string): Promise<MocoActivity[]> => {
    const past = new Date();
    past.setDate(past.getDate() - MOCO_TASK_HISTORY);

    const response = await fetch(`${API_BASE}/activities?from=${formatDate(past)}&to=${formatDate(new Date())}&user_id=${await getUserId(key)}`, {
        headers: {
            Authorization: `Token token=${key}`
        }
    });

    const activities: MocoActivity[] = await response.json();
    return activities.filter(activity => activity.remote_service === 'clickup').reverse();
};

export const trackClickupTask = async (key: string, clickupTask: ClickupTask, timeEntry: ClickupTimeEntry, log: FastifyLoggerInstance): Promise<void> => {
    // track on same task if old activity is found
    const activities = await getActivities(key);
    let activity = activities.find(item => item.tag === (clickupTask.custom_id || clickupTask.id));

    if (typeof activity === 'undefined') {
        log.info('Found no activity for that ClickUp task in MOCO. Searching for folder activity.');
        activity = activities.find(item => item.remote_id === clickupTask.list.id);
    }

    if (typeof activity !== 'undefined') {
        const project = await getProject(key, activity.project.id);

        if (project.active) {
            const taskId = activity.task.id;
            const task = project.tasks.find(item => item.id == taskId);

            if (typeof task !== 'undefined' && task.active) {
                log.info('Tracking time in MOCO based on activity.');
                return await createActivity(key, clickupTask, timeEntry, project.id, task.id);
            }
        }
    }

    // track on task based on similar name
    const similarMatch = await findProjectTaskBySimilarity(key, clickupTask, timeEntry);

    if (similarMatch !== false) {
        log.info('Tracking time in MOCO based on similar match.');
        return await createActivity(key, clickupTask, timeEntry, similarMatch.project, similarMatch.task);
    }

    log.error('Not able to track any time in MOCO');
};

export const createActivity = async (key: string, clickupTask: ClickupTask, timeEntry: ClickupTimeEntry, project: number, task: number): Promise<void> => {
    await fetch(`${API_BASE}/activities`, {
        method: 'post',
        headers: {
            'Authorization': `Token token=${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: `${formatDate(new Date(parseInt(timeEntry.start)))}`,
            description: timeEntry.description || clickupTask.name,
            billable: timeEntry.billable,
            tag: clickupTask.custom_id || clickupTask.id,
            remote_service: 'clickup',
            remote_id: clickupTask.list.id,
            remote_url: clickupTask.url,
            project_id: project,
            task_id: task,
            hours: parseInt(timeEntry.duration) / 3600000
        })
    });
};

const findProjectTaskBySimilarity = async (key: string, clickupTask: ClickupTask, timeEntry: ClickupTimeEntry): Promise<{ project: number; task: number } | false> => {
    const projects = (await getAssignedProjects(key)).filter(project => project.active).filter(project => project.tasks.filter(task => task.active).length > 0);
    if (projects.length == 0) return false;

    const projectCombinations = [projects.map(project => project.name), projects.map(project => project.customer.name)];
    const projectMatch = findMatch([clickupTask.folder.name, clickupTask.list.name], projectCombinations);

    if (typeof projectMatch !== 'undefined') {
        const project = projects[projectMatch.bestMatchIndex];
        const tasks = project.tasks.filter(task => task.active);

        const taskMatch = findMatch([clickupTask.folder.name, clickupTask.list.name, timeEntry.description || clickupTask.name], [tasks.map(task => task.name)]);

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

const formatDate = (date: Date): string => {
    return date.toISOString().slice(0, 10);
};
