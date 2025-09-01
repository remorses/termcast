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
            }, 10)
        })
    }

    async waitIdle({ timeout = 100 }: { timeout?: number } = {}) {
        return new Promise<void>((resolve, reject) => {
            if (!this.idleTimer) {
                setTimeout(() => resolve(), 10)
                return
            }
            const t = setTimeout(() => {
                // console.warn(`reached timeout for waitIdle`)
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
        backspace: () => {
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
        ctrlP: () => {
            return this.write('\x10')
        },
        ctrlC: () => {
            return this.write('\x03')
        },
        ctrlD: () => {
            return this.write('\x04')
        },
        ctrlZ: () => {
            return this.write('\x1a')
        },
        home: () => {
            return this.write('\x1b[H')
        },
        end: () => {
            return this.write('\x1b[F')
        },
        pageUp: () => {
            return this.write('\x1b[5~')
        },
        pageDown: () => {
            return this.write('\x1b[6~')
        },
        delete: () => {
            return this.write('\x1b[3~')
        },
        space: () => {
            return this.write(' ')
        },
        shiftTab: () => {
            return this.write('\x1b[Z')
        },
        cmdEnter: () => {
            return this.write('\x1b\r')
        },
        ctrlA: () => {
            return this.write('\x01')
        },
        type: async (text: string) => {
            for (const ch of text.split('')) {
                await this.write(ch)
            }
            await this.write('')
        },
    }

    async text(options?: {
        waitFor?: (text: string) => boolean
        timeout?: number
    }): Promise<string> {
        const timeout = options?.timeout ?? 5000
        const waitFor = options?.waitFor
        const startTime = Date.now()

        // Helper function to get the current text
        const getCurrentText = () => {
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
                l.length >= leadingSpaces
                    ? l.slice(leadingSpaces)
                    : l.trimStart(),
            )
            // Trim right all lines
            const rightTrimmed = deindented.map((l) => l.replace(/\s+$/, ''))
            return rightTrimmed.join('\n')
        }

        // If waitFor is provided, poll until condition is met or timeout
        if (waitFor) {
            while (Date.now() - startTime < timeout) {
                await this.waitIdle({ timeout: 100 })
                const text = getCurrentText()
                if (waitFor(text)) {
                    return text
                }
            }

            return getCurrentText()
        }


        // await this.waitIdle({ timeout: 200 })
        return getCurrentText()
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

    click(x: number, y: number) {
        // Send mouse click escape sequence
        // ESC[<0;x;yM for button press, ESC[<0;x;ym for button release
        // x and y are 1-based in the terminal protocol
        const xPos = x + 1
        const yPos = y + 1
        // Button press (0 = left button)
        this.pty!.write(`\x1b[<0;${xPos};${yPos}M`)
        // Button release
        return this.write(`\x1b[<0;${xPos};${yPos}m`)
    }

    async clickText(
        pattern: string | RegExp,
        options?: { timeout?: number }
    ): Promise<void> {
        const timeout = options?.timeout ?? 5000
        const startTime = Date.now()
        const regex = typeof pattern === 'string' 
            ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            : pattern

        while (Date.now() - startTime < timeout) {
            await this.waitIdle({ timeout: 100 })
            
            // Get the current buffer state
            const b = this.term.buffer.active
            
            // Search through each line for the pattern
            for (let y = 0; y < this.rows; y++) {
                const line = b.getLine(y)?.translateToString(true) ?? ''
                const match = line.match(regex)
                
                if (match && match.index !== undefined) {
                    // Found the text, click on the first character
                    await this.click(match.index, y)
                    return
                }
            }
        }

        throw new Error(`Text matching pattern "${pattern}" not found within ${timeout}ms`)
    }

    dispose() {
        this.pty?.kill()
        this.term.dispose()
    }
}
