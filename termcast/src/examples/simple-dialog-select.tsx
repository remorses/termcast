import { render } from '@opentui/react'
import DialogSelect from '../dialog-select'
import { logger } from '../logger'

const App: any = () => {
    const handleSelect = (key: string) => {
        logger.log('Selected:', key)
    }

    return (
        <DialogSelect 
            title="Choose a Command" 
            onSelect={handleSelect}
            current="settings"
            placeholder="Search commands..."
        >
            <DialogSelect.Section title="Navigation">
                <DialogSelect.Option
                    id="home"
                    title="Home"
                    description="Go to homepage"
                    keywords={['main', 'dashboard', 'start']}
                />
                <DialogSelect.Option
                    id="back"
                    title="Back"
                    description="Go back to previous page"
                    keywords={['previous', 'return']}
                />
                <DialogSelect.Option
                    id="forward"
                    title="Forward"
                    description="Go forward to next page"
                    keywords={['next', 'ahead']}
                />
            </DialogSelect.Section>

            <DialogSelect.Section title="File">
                <DialogSelect.Option
                    id="new"
                    title="New"
                    description="Create a new file"
                    keywords={['create', 'add']}
                />
                <DialogSelect.Option
                    id="open"
                    title="Open"
                    description="Open an existing file"
                    keywords={['load', 'browse']}
                />
                <DialogSelect.Option
                    id="save"
                    title="Save"
                    description="Save current file"
                    keywords={['write', 'store']}
                />
                <DialogSelect.Option
                    id="save-as"
                    title="Save As"
                    description="Save with a new name"
                    keywords={['export', 'copy']}
                />
            </DialogSelect.Section>

            <DialogSelect.Section title="Edit">
                <DialogSelect.Option
                    id="undo"
                    title="Undo"
                    description="Undo last action"
                    keywords={['revert', 'back']}
                />
                <DialogSelect.Option
                    id="redo"
                    title="Redo"
                    description="Redo last undone action"
                    keywords={['repeat', 'forward']}
                />
                <DialogSelect.Option
                    id="cut"
                    title="Cut"
                    description="Cut selected text"
                    keywords={['remove', 'clipboard']}
                />
                <DialogSelect.Option
                    id="copy"
                    title="Copy"
                    description="Copy selected text"
                    keywords={['duplicate', 'clipboard']}
                />
                <DialogSelect.Option
                    id="paste"
                    title="Paste"
                    description="Paste from clipboard"
                    keywords={['insert', 'clipboard']}
                />
            </DialogSelect.Section>

            <DialogSelect.Section title="System">
                <DialogSelect.Option
                    id="settings"
                    title="Settings"
                    description="Configure application settings"
                    keywords={['preferences', 'config', 'options']}
                />
                <DialogSelect.Option
                    id="help"
                    title="Help"
                    description="View help documentation"
                    keywords={['docs', 'manual', 'guide']}
                />
                <DialogSelect.Option
                    id="about"
                    title="About"
                    description="About this application"
                    keywords={['info', 'version']}
                />
            </DialogSelect.Section>
        </DialogSelect>
    )
}

render(<App />)