// TODO node-pty has bugs, not all text is shown

import * as pty from 'node-pty'
import { Terminal } from '@xterm/headless'
import { SerializeAddon } from '@xterm/addon-serialize'

export class NodeTuiDriver {
    private pty?: pty.IPty
    private term: Terminal
    private serialize: SerializeAddon
    private cols: number
    private rows: number
    private idleResolvers: Array<() => void> = []
    private idleTimer?: NodeJS.Timeout

    constructor(
        private cmd: string,
        private args: string[] = [],
        {
            cols = 80,
            rows = 24,
            cwd = process.cwd(),
            env = process.env,
        }: {
            cols?: number
            rows?: number
            cwd?: string
            env?: NodeJS.ProcessEnv
        } = {},
    ) {
        this.cols = cols
        this.rows = rows
        this.term = new Terminal({
            cols,
            rows,
            scrollback: 0,
            allowProposedApi: true,
            minimumContrastRatio: 1,
            drawBoldTextInBrightColors: true,
            allowTransparency: false,
            theme: {
                background: '#000000',
                foreground: '#ffffff',
            },
        })
        this.serialize = new SerializeAddon()
        this.term.loadAddon(this.serialize)

        const envWithTerm = {
            ...env,
            TERM: 'xterm-truecolor',
            COLORTERM: 'truecolor',
        }
        this.pty = pty.spawn(this.cmd, this.args, {
            name: 'xterm-truecolor',
            cols,
            rows,
            cwd,
            env: envWithTerm as any,
        })

        this.pty.onData((data) => {
            this.term.write(data)
            clearTimeout(this.idleTimer)
            this.idleTimer = setTimeout(() => {
                const r = this.idleResolvers.splice(0)
                r.forEach((fn) => {
                    fn()
                })
            }, 50)
        })
    }

    async waitIdle({ timeout = 500 }: { timeout?: number } = {}) {
        return new Promise<void>((resolve, reject) => {
            if (!this.idleTimer) {
                setTimeout(() => resolve(), 100)
                return
            }
            const t = setTimeout(() => {
                resolve() // Just resolve instead of rejecting
            }, timeout)
            this.idleResolvers.push(() => {
                clearTimeout(t)
                resolve()
            })
        })
    }

    async write(data: string) {
        this.pty!.write(data)
        await new Promise((resolve) => setTimeout(resolve, 50))
        return this.waitIdle()
    }

    keys = {
        enter: () => {
            return this.write('\r')
        },
        esc: () => {
            return this.write('\x1b')
        },
        escape: () => {
            return this.write('\x1b')
        },
        bs: () => {
            return this.write('\x7f')
        },
        up: () => {
            return this.write('\x1b[A')
        },
        down: () => {
            return this.write('\x1b[B')
        },
        right: () => {
            return this.write('\x1b[C')
        },
        left: () => {
            return this.write('\x1b[D')
        },
        tab: () => {
            return this.write('\t')
        },
        ctrlK: () => {
            return this.write('\x0b')
        },
    }

    async text(): Promise<string> {
        // small idle to allow terminal to settle
        await this.waitIdle({ timeout: 100 })
        const b = this.term.buffer.active
        const lines: string[] = []
        for (let y = 0; y < this.rows; y++) {
            const line = b.getLine(y)?.translateToString(true) ?? ''
            lines.push(line)
        }
        // Remove trailing lines that are only spaces
        let lastNonEmpty = lines.length - 1
        while (lastNonEmpty >= 0 && lines[lastNonEmpty].trim() === '') {
            lastNonEmpty--
        }
        const trimmed = lines.slice(0, lastNonEmpty + 1)
        // Strip leading indentation common to all non-empty lines
        const nonEmpty = trimmed.filter((l) => l.trim().length > 0)
        const leadingSpaces = nonEmpty.length
            ? Math.min(
                  ...nonEmpty.map((l) => {
                      const m = l.match(/^\s*/)
                      return m ? m[0].length : 0
                  }),
              )
            : 0
        const deindented = trimmed.map((l) =>
            l.length >= leadingSpaces ? l.slice(leadingSpaces) : l.trimStart(),
        )
        // Trim right all lines
        const rightTrimmed = deindented.map((l) => l.replace(/\s+$/, ''))
        return rightTrimmed.join('\n')
    }

    vt(): string {
        return this.serialize.serialize()
    }

    resize({ cols, rows }: { cols: number; rows: number }) {
        this.cols = cols
        this.rows = rows
        this.term.resize(cols, rows)
        this.pty!.resize(cols, rows)
    }

    dispose() {
        this.pty?.kill()
        this.term.dispose()
    }
}
