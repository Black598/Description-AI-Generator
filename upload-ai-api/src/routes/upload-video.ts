import { FastifyInstance } from "fastify";
import {fastifyMultipart } from "@fastify/multipart"
import path from "node:path"
import { prisma } from "../lib/prisma"
import { randomUUID } from "node:crypto";
import fs from 'node:fs'
import { pipeline } from "node:stream"
import { promisify } from "node:util";

const pump = promisify(pipeline)

export async function uploadVideoRoutes (app: FastifyInstance) {

    app.register(fastifyMultipart, { 
        limits:{
            fileSize: 1_048_576 * 25, // 25 mb
        }})

    app.post('/videos',async (request, reply) => {
        const data = await request.file()

        if (!data) {
            return reply.status(400).send({error: "missing file input."})
        }

        const extension = path.extname(data.filename)

        if (extension != '.mp3'){ 
            return reply.status(400).send({error: "Extension wrong!"});
        }

        const fileBaseName = path.basename(data.filename, extension);
        const fileUploadName = `${fileBaseName} - ${randomUUID()} - ${extension}`
        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName);

        await pump(data.file, fs.createWriteStream(uploadDestination))
   
        const video = await prisma.video.create({
            data: {
            name: data.filename,
            path: uploadDestination
        }
        })
        
        return {video}
    })
}