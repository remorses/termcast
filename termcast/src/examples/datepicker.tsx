import { render, useKeyboard } from '@opentui/react' // renderer & hooks per docs
import { useMemo, useState } from 'react'

// ----- Helpers -----
type Focus = 'year' | 'month' | 'grid'

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate()
}
function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
}
function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}
function addDays(d: Date, delta: number) {
    const nd = new Date(d)
    nd.setDate(nd.getDate() + delta)
    return nd
}
function clampDay(y: number, m: number, day: number) {
    return Math.min(day, daysInMonth(y, m))
}
function generateSixWeekGrid(
    viewDate: Date,
    weekStartsOnSunday = true,
): Date[][] {
    // Strategy: 7x6 grid, include prev/next month days to fill 42 cells
    const first = startOfMonth(viewDate)
    const firstWeekday = first.getDay() // 0=Sun..6=Sat
    const offset = weekStartsOnSunday ? firstWeekday : (firstWeekday + 6) % 7 // support Mon if needed later
    const grid: Date[][] = []
    const start = addDays(first, -offset)
    for (let w = 0; w < 6; w++) {
        const row: Date[] = []
        for (let i = 0; i < 7; i++) row.push(addDays(start, w * 7 + i))
        grid.push(row)
    }
    return grid
}

// ----- Component -----
function DatePicker() {
    const today = useMemo(() => new Date(), [])
    const [focus, setFocus] = useState<Focus>('grid') // can be "year" | "month" | "grid"
    const [selected, setSelected] = useState<Date>(new Date()) // focused day
    const [visible, setVisible] = useState<Date>(startOfMonth(new Date())) // month being shown

    // Recompute 7x6 grid for the visible month
    const weeks = useMemo(() => generateSixWeekGrid(visible, true), [visible])

    // Keep visible month synced when selected day moves across months
    function ensureVisibleFor(date: Date) {
        const m = new Date(date.getFullYear(), date.getMonth(), 1)
        const keyA = visible.getFullYear() * 12 + visible.getMonth()
        const keyB = m.getFullYear() * 12 + m.getMonth()
        if (keyA !== keyB) setVisible(m)
    }

    function changeMonth(delta: number) {
        const y = visible.getFullYear()
        const m = visible.getMonth() + delta
        const newY = y + Math.floor(m / 12)
        const newM = ((m % 12) + 12) % 12
        const day = clampDay(newY, newM, selected.getDate())
        const newSel = new Date(newY, newM, day)
        setVisible(new Date(newY, newM, 1))
        setSelected(newSel)
    }

    function changeYear(delta: number) {
        const y = visible.getFullYear() + delta
        const m = visible.getMonth()
        const day = clampDay(y, m, selected.getDate())
        const newSel = new Date(y, m, day)
        setVisible(new Date(y, m, 1))
        setSelected(newSel)
    }

    // Arrow-key only interactions
    useKeyboard((key) => {
        switch (key.name) {
            case 'left':
                if (focus === 'grid') {
                    const next = addDays(selected, -1)
                    setSelected(next)
                    ensureVisibleFor(next)
                } else if (focus === 'month') {
                    changeMonth(-1)
                } else if (focus === 'year') {
                    changeYear(-1)
                }
                break
            case 'right':
                if (focus === 'grid') {
                    const next = addDays(selected, +1)
                    setSelected(next)
                    ensureVisibleFor(next)
                } else if (focus === 'month') {
                    changeMonth(+1)
                } else if (focus === 'year') {
                    changeYear(+1)
                }
                break
            case 'up':
                // Move focus: grid -> month -> year
                setFocus((f) =>
                    f === 'grid' ? 'month' : f === 'month' ? 'year' : 'year',
                )
                if (focus === 'grid') {
                    const next = addDays(selected, -7)
                    setSelected(next)
                    ensureVisibleFor(next)
                }
                break
            case 'down':
                // Move focus: year -> month -> grid
                setFocus((f) =>
                    f === 'year' ? 'month' : f === 'month' ? 'grid' : 'grid',
                )
                if (focus === 'grid') {
                    const next = addDays(selected, +7)
                    setSelected(next)
                    ensureVisibleFor(next)
                }
                break
            default:
                // ignore all other keys (only arrows supported)
                break
        }
    })

    const y = visible.getFullYear()
    const m = visible.getMonth()
    const headerWidth = 7 * 4 // 7 columns * 4-char cells (strategy: fixed-width day boxes)
    const cellStyle = {
        width: 4,
        height: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    }

    return (
        <box
            style={{
                flexDirection: 'column',
                alignItems: 'center',
                padding: 1,
            }}
        >
            {/* Year (line 1) */}
            <box
                style={{
                    width: headerWidth,
                    height: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focus === 'year' ? '#444444' : undefined,
                    marginBottom: 0,
                }}
                onMouseDown={() => setFocus('year')}
            >
                <text fg={focus === 'year' ? '#FFFFFF' : '#DDDDDD'}>
                    {String(y)}
                </text>
            </box>

            {/* Month (line 2) */}
            <box
                style={{
                    width: headerWidth,
                    height: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focus === 'month' ? '#444444' : undefined,
                    marginBottom: 1,
                }}
                onMouseDown={() => setFocus('month')}
            >
                <text fg={focus === 'month' ? '#FFFFFF' : '#DDDDDD'}>
                    {MONTHS[m]}
                </text>
            </box>

            {/* Weekday header */}
            <box
                style={{
                    flexDirection: 'row',
                    width: headerWidth,
                    justifyContent: 'space-between',
                    marginBottom: 0,
                }}
            >
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                    <box key={wd} style={cellStyle}>
                        <text fg='#888888'>{wd}</text>
                    </box>
                ))}
            </box>

            {/* Days grid: 7 columns x 6 rows, same fixed-box strategy */}
            <box style={{ flexDirection: 'column' }}>
                {weeks.map((row, i) => (
                    <box key={i} style={{ flexDirection: 'row' }}>
                        {row.map((d, j) => {
                            const inMonth = d.getMonth() === m
                            const isSel = sameDay(d, selected)
                            const isToday = sameDay(d, today)
                            return (
                                <box
                                    key={`${i}-${j}`}
                                    style={{
                                        ...cellStyle,
                                        backgroundColor:
                                            isSel && focus === 'grid'
                                                ? '#555555'
                                                : undefined, // focus background on day number
                                    }}
                                    onMouseDown={() => {
                                        setSelected(d)
                                        setFocus('grid')
                                        ensureVisibleFor(d)
                                    }}
                                >
                                    <text
                                        fg={
                                            isSel && focus === 'grid'
                                                ? '#FFFFFF'
                                                : inMonth
                                                  ? isToday
                                                      ? '#00FF88'
                                                      : '#DDDDDD'
                                                  : '#777777'
                                        }
                                    >
                                        {String(d.getDate()).padStart(2, ' ')}
                                    </text>
                                </box>
                            )
                        })}
                    </box>
                ))}
            </box>
        </box>
    )
}

render(<DatePicker />) // per @opentui/react Quick Start
