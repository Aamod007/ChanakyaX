import { ChatInputCommandInteraction, DiscordAPIError, 
    Message, TextChannel, ThreadAutoArchiveDuration, ThreadChannel } from "discord.js";

const wait = require('node:timers/promises').setTimeout;

interface QueueObject {
    [interactionId: string]: {
        interaction: ChatInputCommandInteraction,
        status: {
            position: number,
            processing: boolean,
            waiting: boolean
        },
        thread: ThreadChannel | undefined
    }
}

class Queue {
    queue: QueueObject;
    interval: NodeJS.Timeout | undefined;
    private static readonly CONCURRENT_QUEUE_SIZE = 3;
    private static readonly LLM_MODEL = "deepseek-r1:7b";

    constructor() {
        this.queue = {};
    }

    addItem(interaction: ChatInputCommandInteraction) {
        
        const queueLength = this.length();
        this.queue[interaction.id] = {
            interaction: interaction,
            status: {
                position: queueLength,
                processing: false,
                waiting: false
            },
            thread: undefined
        };


        if (this.interval === undefined){
            console.log("Starting the queue processor");
            this.startQueue();
        }
    }

    removeItem(interactionId: string) {
        console.log(`Removed ${interactionId} from queue`);
        delete this.queue[interactionId]
        
        const interactionIds = Object.keys(this.queue);
        for (let i = 0; i < interactionIds.length; i++){
            this.queue[interactionIds[i]].status.position--;
        }
    }

    getItem(interactionId: string) {
        return this.queue[interactionId]
    }

    length() {
        return Object.keys(this.queue).length;
    }

    isEmpty() {
        return Object.keys(this.queue).length === 0 && this.queue.constructor === Object;
    }

    startQueue() {
        this.interval = setInterval(() => this.processQueue(), 3000)
    }

    stopQueue() {
        console.log("Entire queue has been processed. Stopping the queue processor")
        clearInterval(this.interval);
        this.interval = undefined;
    }

    assignThread(interactionId: string, thread: ThreadChannel) {
        this.queue[interactionId].thread = thread;
    }

    processQueue = async () => {
        
        if (this.isEmpty()){
            this.stopQueue();
            return;
        }

        const interactionIds = Object.keys(this.queue);
        let currentlyBeingProcessedCount = 0;

        for (let i = 0; i < interactionIds.length; i++){
            const interactionId = interactionIds[i];
            const positionInQueue = this.queue[interactionId].status.position;
            const processing = this.queue[interactionId].status.processing;
            const interaction = this.queue[interactionId].interaction; 
            const channelId = this.queue[interactionId].interaction.channelId;      
            const channel = await this.queue[interactionId].interaction.client.channels.fetch(channelId);
            
            
            if (!processing && currentlyBeingProcessedCount < Queue.CONCURRENT_QUEUE_SIZE){
                console.log(`Processing task with interaction id ${interactionId}`)

                this.queue[interactionId].status.processing = true;
                
                this.processTask(interaction, <TextChannel>channel!);
                currentlyBeingProcessedCount++;
            }
            else if (!processing && currentlyBeingProcessedCount > Queue.CONCURRENT_QUEUE_SIZE){
                await wait(3000); 
                await interaction.editReply(`There are ${positionInQueue - Queue.CONCURRENT_QUEUE_SIZE}`
                    + ` people ahead of you in the queue. Please wait your turn...`);
                
            }
            else{
                currentlyBeingProcessedCount++;
            }
        }
    }

    processTask = async (interaction: ChatInputCommandInteraction, channel: TextChannel) => {
        const prompt = interaction.options.getString("input");
        const userId = interaction.user.id;
        const userName = interaction.user.displayName;

        console.log(`User sent message ${userId} with prompt: ${prompt}`);

        const newThread = await channel.threads.create({
            name: `[${userName}] - Prompt: ${prompt ?? "Prompt"}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            reason: 'LLM Bot Auto Created Thread',
        });

        this.assignThread(interaction.id, newThread);

        const url = "http://localhost:11434/api/generate"

        const userPrompt = interaction.options.getString("input");

        const data = {
        "prompt": `Please respond only in English.\n\n${userPrompt}`,
        "model": Queue.LLM_MODEL,
        "stream": true
        };


        const removeItem = (interactionId: string) => {
            this.removeItem(interactionId);
        }

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(data)
        })
        .then((response) => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let result = "";
            let responseChunks: Array<string> = [];
            let messages: Array<Message> = [];

            const throttleResponse = async () => {

                if (messages.length === 0 || messages.length !== responseChunks.length){
                    const message = await newThread.send(responseChunks[responseChunks.length - 1]);
                    messages.push(message);
                }

                for (let i = 0; i < messages.length; i++){
                    if (messages[i].content !== responseChunks[i]){
                        messages[i].edit(responseChunks[i]);
                    }
                }

            }

            const throttleResponseInterval = setInterval(() => throttleResponse(), 2000);

            return new ReadableStream({
                start(controller) {
                    return pump();
                    function pump(): any {
                        return reader?.read().then(async function( { done, value }){
                         
                            if (done) {
                                console.log(`Task with interaction id ${interaction.id} complete.`);
                                await wait(2000);
                                messages[messages.length - 1].edit(responseChunks[responseChunks.length - 1]);
                                clearInterval(throttleResponseInterval);
                                await interaction.deleteReply();
                                removeItem(interaction.id);
                                controller.close();
                                return;
                            }
                            
                            let chunk = JSON.parse(decoder.decode(value)).response;
                            chunk = chunk.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                            if (!chunk || chunk === '') return pump();
                            if (responseChunks.length === 0){
                                responseChunks.push(result);
                            }

                            if (result.length + chunk.length > 1800){
                                responseChunks.push(chunk);
                                result = "";
                            }
                            else{
                                responseChunks[responseChunks.length - 1] = responseChunks[responseChunks.length - 1].concat(chunk);
                                result += chunk;
                            }    

                            controller.enqueue(value);
                            return pump();
                        });
                    }
                },
            });
        })
        .catch(async (error) => {
            console.error('Error:', error);
            if (error instanceof DiscordAPIError && error.code === 10008) {
                await newThread.send("WARNING: Sending messages in the same thread as the bot while processing may break the response.");
            }
            await interaction.editReply("An error occured. Please try again later.");
        });
    }
}

export default Queue;
