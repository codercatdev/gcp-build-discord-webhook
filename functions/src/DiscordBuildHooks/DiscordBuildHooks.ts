import * as functions from 'firebase-functions';

export const gcpBuildTriggerDiscord = functions.pubsub.topic('gcp-build-discord').onPublish(async (pubSubEvent) => {
    const build = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());

    console.log(JSON.stringify(build));
});