import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const gcpBuildTriggerDiscord = functions.pubsub.topic('cloud-builds').onPublish(async (pubSubEvent) => {
    const build = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());
    const status = ['SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT'];
    if (status.indexOf(build.status) === -1) {
        console.log('Status not found');
    }

    try {
        const msg = createBuildMessage(build);
        await sendDiscordBuildPost(msg);
    } catch (err) {
        console.log(err);
    }
});

const sendDiscordBuildPost = async (body: object) => {
    console.log(`Calling Discord wtih`, JSON.stringify(body));
    const result = await fetch(functions.config().discord.build_hook, {
        body: JSON.stringify(body),
        method: 'POST',
        headers: { "Content-Type": "application/json" }
    });
    console.log(result.json());
}

const createBuildMessage = (build: GoogleCloudBuild) => {
    const embeds: Embed[] = [];
    const msg = {
        content: `Build ${build.id} for project ${build.projectId} was a ${build.status} ` +
            `took ${(<any>new Date(build.finishTime) - <any>new Date(build.startTime)) * .001}`,
        tts: build.status === 'FAILURE' ? true : false,
        embeds: embeds
    }
    if (build && build.steps) {
        build.steps.forEach(step => {
            embeds.push({
                title: step.name,
                description:
                    `${step.entrypoint} ${step.args.join(' ')}` +
                    `took ${(<any>new Date(step.timing.endTime) - <any>new Date(step.timing.startTime)) * .001}` +
                    `and ${step.status}`,
                color: build.status === 'FAILURE' ? 16714507 : 6618931
            });
        });
        msg.embeds = embeds;
    }
    return msg;
}

export interface Embed {
    title?: string;
    description?: string;
    color?: number;
}


export interface GoogleCloudBuild {
    id: string;
    projectId: string;
    status: string;
    steps: Step[];
    createTime: Date;
    startTime: Date;
    finishTime: Date;
    buildTriggerId: string;
    options: Options;
}

export interface Options {
    substitutionOption?: string;
    logging?: string;
}

export interface Step {
    name: string;
    args: string[];
    entrypoint: string;
    timing: Timing;
    pullTiming: Timing;
    status: string;
}

export interface Timing {
    startTime: Date;
    endTime: Date;
}