import JSZip from 'jszip'

export async function downloadExtension({
    author,
    extension,
}: {
    author: string
    extension: string
}): Promise<{ buffer: Buffer; filename: string }[]> {
    // curl -H 'cookie: __raycast_session=<SESSION_TOKEN>' \
    //      -H 'accept: */*' \
    //      -H 'user-agent: Raycast/1.102.6 (macOS Version 15.6 (Build 24G84))' \
    //      -H 'accept-language: en-GB,en;q=0.9' \
    //      -H 'authorization: Bearer <AUTH_TOKEN>' \
    //      https://backend.raycast.com/api/v1/extensions/mt40/memo/download
    const url = `https://backend.raycast.com/api/v1/extensions/${author}/${extension}/download`

    const response = await fetch(url, {
        redirect: 'follow',
        headers: {
            accept: '*/*',
            'user-agent': 'Raycast/1.102.6 (macOS Version 15.6 (Build 24G84))',
            'accept-language': 'en-GB,en;q=0.9',
        },
    })

    const arrayBuffer = await response.arrayBuffer()
    
    // Check if we got an error response instead of a zip
    if (!response.ok) {
        const text = new TextDecoder().decode(arrayBuffer)
        throw new Error(`Failed to download extension: ${response.status} - ${text}`)
    }
    
    const zip = await JSZip.loadAsync(Buffer.from(arrayBuffer))

    const files: { buffer: Buffer; filename: string }[] = []

    for (const [filename, file] of Object.entries(zip.files)) {
        if (!file.dir) {
            const buffer = await file.async('nodebuffer')
            files.push({ buffer, filename })
        }
    }

    return files
}
