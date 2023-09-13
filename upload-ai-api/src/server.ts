import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors'
import { getAllPromptsRoute } from './routes/get-all-prompts';
import { uploadVideoRoutes } from './routes/upload-video';
import { createTranscriptionRoute } from './routes/create-transcription';
import {generateAICompletionRoute } from './routes/generation-ai-completions';

const app = fastify()

app.register (fastifyCors, { 
    origin: "*",
})

app.register (getAllPromptsRoute)
app.register (uploadVideoRoutes)
app.register (createTranscriptionRoute)
app.register (generateAICompletionRoute)

app.listen({
    port: 3333,
}).then(() => {
    console.log("HTTP Server Running")
})