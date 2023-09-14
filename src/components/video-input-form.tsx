import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFMpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from '@/lib/axios'

type Status = "waiting" | "converting" | "uploading" | "getting" | "success"
const statusMessages = {
    converting: "Convertendo...",
    uploading: "Transcrevendo...",
    getting: "Carregando...",
    success: "Sucesso!",
 }

 interface videoInputFormProps {
    onVideoUploaded: (id: string) => void;
 }
export function VideInputForm(props: videoInputFormProps) {

const [videoFile, setVideoFile ] = useState<File | null>(null)
const [status, setStatus] = useState <Status> ('waiting')
const promptInputRef = useRef<HTMLTextAreaElement> (null)

//essa porra aqui converte video em audio
async function convertVideoToAudio(video:File) {
    console.log('convert started.')

    const ffmpeg = await getFFMpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

   // ffmpeg.on('log', log => {console.log(log)})

   ffmpeg.on('progress', progress => {
    console.log('Convert progress:' + Math.round(progress.progress * 100))
   })

   await ffmpeg.exec([
    '-i',
    'input.mp4', 
    '-map',
    '0:a',
    '-b:a', 
    '20k',
    '-acodec',
    'libmp3lame',
    'output.mp3'

   ])

   const data  = await ffmpeg.readFile ('output.mp3')

   const audioFileBlob = new Blob ([data], { type: 'audio/mpeg' })
   const audioFile = new File([audioFileBlob], 'audio.mp3', { type: 'audio/mpeg'})

   console.log ('convert finished')

   return audioFile

}
//essa desgraça aqui seleciona o arquivo de video
function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {

    const {files} = event.currentTarget

    if (!files){
        return
    }
    const selectedFile = files[0]

    setVideoFile(selectedFile)
}
async function handleUploadVideo (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value

    if (!videoFile) {
        return;
    }

    setStatus('converting')

    // Convert video to audio
    const audioFile = await convertVideoToAudio(videoFile)
    

    const data = new FormData()

    data.append('file',audioFile)

    setStatus('uploading')

    const response = await api.post('/videos', data)
    
    const videoId = response.data.video.id

    setStatus('getting')

    await api.post(`/videos/${videoId}/transcription` , {
        prompt,
    })

    setStatus('success')
    props.onVideoUploaded(videoId)
}

const previewURL = useMemo(() => {
    if (!videoFile) {return null}

    return URL.createObjectURL(videoFile)
},[videoFile])

return ( 

    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label htmlFor="video" className="relative  border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
        
       {previewURL ? (<video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />) : ( 
        <>  
       <FileVideo/>
        Selecione um Vídeo
        </>
        )}
        
      </label>

      <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected}/> 

      <Separator/>

      <div className="space-y-2">
        <Label htmlFor="transcription-prompt" >Prompt de Transcrição</Label>
        <Textarea 
        ref={promptInputRef}
        disabled = {status != 'waiting'}
        id="transcription-prompt" 
        className="h-20 leading-relaxed resize-none"
        placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgulas"
        />
      </div>

      <Button disabled={status != 'waiting'} type="submit" className="w-full">
        {status === 'waiting' ? (
            <>
            Carregar Vídeo
            <Upload className="w-4 h-4 ml-2"/>    
            </>
        ) : statusMessages [status]}
        

        
      </Button>
    </form>
    )
}