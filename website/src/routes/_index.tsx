export const loader = () => {
    return {}
}

export default function Index() {
    return (
        <div className='min-h-screen flex items-center justify-center bg-background'>
            <div className='text-center px-4'>
                <h1 className='text-4xl font-semibold mb-4'>
                    Raycast for the terminal
                </h1>
                <p className='text-lg'>coming soon</p>
                <a
                    href='https://github.com/remorses/termcast'
                    className='text-blue-500 underline mt-4 inline-block'
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    View on GitHub
                </a>
            </div>
        </div>
    )
}
