import { spawn, type IPty } from 'bun-pty'
import { Terminal } from '@xterm/headless'
import { SerializeAddon } from '@xterm/addon-serialize'

export class TuiDriver {
    private pty?: IPty
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
        this.term = new Terminal({ cols, rows, scrollback: 0, allowProposedApi: true })
        this.serialize = new SerializeAddon()
        this.term.loadAddon(this.serialize)

        env = { ...env, TERM: 'xterm-256color' }
        this.pty = spawn(this.cmd, this.args, { cols, rows, cwd, env })

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
                reject(new Error('waitIdle timeout'))
            }, timeout)
            this.idleResolvers.push(() => {
                clearTimeout(t)
                resolve()
            })
        })
    }

    async write(data: string) {
        this.pty!.write(data)
        await new Promise(resolve => setTimeout(resolve, 50))
        return this.waitIdle()
    }

    keys = {
        enter: () => {
            return this.write('\r')
        },
        esc: () => {
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
    }

    text(): string {
        const b = this.term.buffer.active
        const lines: string[] = []
        for (let y = 0; y < this.rows; y++) {
            lines.push(b.getLine(y)?.translateToString(true) ?? '')
        }
        return lines.join('\n')
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