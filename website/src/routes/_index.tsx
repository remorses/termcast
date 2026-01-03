export const loader = () => {
  return {}
}

export default function Index() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='text-center px-4 max-w-2xl'>
        <h1 className='text-4xl font-semibold mb-4'>
          Build TUIs with React and a Raycast APIs
        </h1>
        <p className='text-lg text-muted-foreground mb-6'>
          A framework for building terminal user interfaces. Port your Raycast
          extensions to the terminal, or build new TUIs from scratch.
        </p>
        <div className='flex gap-4 justify-center flex-wrap'>
          <a
            href='https://github.com/remorses/termcast'
            className='text-blue-500 underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
