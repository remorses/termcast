import { render, useKeyboard } from '@opentui/react' // renderer & hooks per docs
import { useMemo, useState, useRef } from 'react'

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
function DatePicker({ enableColors = true }: { enableColors?: boolean }) {
    const today = useMemo(() => new Date(), [])
    const [focus, setFocus] = useState<Focus>('grid') // can be "year" | "month" | "grid"
    const [selected, setSelected] = useState<Date>(new Date()) // focused day
    const [visible, setVisible] = useState<Date>(startOfMonth(new Date())) // month being shown
    const [searchQuery, setSearchQuery] = useState('') // for type-to-search
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

    // Generate years list for search
    const years = useMemo(() => {
        const yearList: number[] = []
        for (let y = 1800; y <= 2200; y++) {
            yearList.push(y)
        }
        return yearList
    }, [])

    // Search functionality
    function searchYear(query: string) {
        const matches = years.filter(y => y.toString().startsWith(query))
        if (matches.length > 0) {
            const newY = matches[0]
            const m = visible.getMonth()
            const day = clampDay(newY, m, selected.getDate())
            const newSel = new Date(newY, m, day)
            setVisible(new Date(newY, m, 1))
            setSelected(newSel)
        }
    }

    function searchMonth(query: string) {
        // Search by month name or number
        const lowerQuery = query.toLowerCase()
        let monthIndex = -1

        // Try to match month name
        for (let i = 0; i < MONTHS.length; i++) {
            if (MONTHS[i].toLowerCase().startsWith(lowerQuery)) {
                monthIndex = i
                break
            }
        }

        // Try to match month number
        if (monthIndex === -1) {
            const num = parseInt(query)
            if (!isNaN(num) && num >= 1 && num <= 12) {
                monthIndex = num - 1
            }
        }

        if (monthIndex !== -1) {
            const y = visible.getFullYear()
            const day = clampDay(y, monthIndex, selected.getDate())
            const newSel = new Date(y, monthIndex, day)
            setVisible(new Date(y, monthIndex, 1))
            setSelected(newSel)
        }
    }

    function searchDay(query: string) {
        const day = parseInt(query)
        if (!isNaN(day) && day >= 1 && day <= 31) {
            const y = visible.getFullYear()
            const m = visible.getMonth()
            const clampedDay = clampDay(y, m, day)
            const newSel = new Date(y, m, clampedDay)
            setSelected(newSel)
        }
    }

    // Keyboard interactions
    useKeyboard((key) => {
        // Handle type-to-search
        if (key.name.length === 1 && /[0-9a-zA-Z]/.test(key.name)) {
            const newQuery = searchQuery + key.name
            setSearchQuery(newQuery)

            // Clear previous timeout
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }

            // Perform search based on current focus
            if (focus === 'year') {
                searchYear(newQuery)
            } else if (focus === 'month') {
                searchMonth(newQuery)
            } else if (focus === 'grid') {
                searchDay(newQuery)
            }

            // Reset search query after 1 second
            searchTimeoutRef.current = setTimeout(() => {
                setSearchQuery('')
            }, 1000)
            return
        }

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
                if (focus === 'grid') {
                    const next = addDays(selected, -7)
                    setSelected(next)
                    ensureVisibleFor(next)
                }
                break
            case 'down':
                if (focus === 'grid') {
                    const next = addDays(selected, +7)
                    setSelected(next)
                    ensureVisibleFor(next)
                }
                break
            case 'tab':
                if (key.shift) {
                    // Shift+Tab: Move focus up (grid -> month -> year)
                    setFocus((f) =>
                        f === 'grid' ? 'month' : f === 'month' ? 'year' : 'year',
                    )
                } else {
                    // Tab: Move focus down (year -> month -> grid)
                    setFocus((f) =>
                        f === 'year' ? 'month' : f === 'month' ? 'grid' : 'grid',
                    )
                }
                break
            default:
                break
        }
    })

    const y = visible.getFullYear()
    const m = visible.getMonth()
    const headerWidth = 20 // Match form.md width
    const cellStyle = {
        width: 3,
        height: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    }

    // Only show days from current month
    const filteredWeeks = weeks.map(row =>
        row.map(d => d.getMonth() === m ? d : null)
    )

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
                    backgroundColor: enableColors && focus === 'year' ? '#1e40af' : undefined,
                    marginBottom: 0,
                }}
                onMouseDown={() => setFocus('year')}
            >
                <text fg={focus === 'year' ? '#FFFFFF' : '#666666'}>
                    ← {String(y)} →
                </text>
            </box>

            {/* Month (line 2) */}
            <box
                style={{
                    width: headerWidth,
                    height: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: enableColors && focus === 'month' ? '#1e40af' : undefined,
                    marginBottom: 1,
                }}
                onMouseDown={() => setFocus('month')}
            >
                <text fg={focus === 'month' ? '#FFFFFF' : '#666666'}>
                    ← {MONTHS[m]} →
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
                        <text fg='#666666'>{wd}</text>
                    </box>
                ))}
            </box>

            {/* Days grid: 7 columns x 6 rows, same fixed-box strategy */}
            <box style={{ flexDirection: 'column' }}>
                {filteredWeeks.map((row, i) => {
                    // Skip empty rows
                    if (row.every(d => d === null)) return null

                    return (
                        <box key={i} style={{ flexDirection: 'row' }}>
                            {row.map((d, j) => {
                                if (d === null) {
                                    return (
                                        <box key={`${i}-${j}`} style={cellStyle}>
                                            <text> </text>
                                        </box>
                                    )
                                }

                                const isSel = sameDay(d, selected)
                                const isToday = sameDay(d, today)
                                return (
                                    <box
                                        key={`${i}-${j}`}
                                        style={{
                                            ...cellStyle,
                                            backgroundColor:
                                                enableColors && isSel && focus === 'grid'
                                                    ? '#2563eb'
                                                    : undefined,
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
                                                    : isToday && enableColors
                                                      ? '#3b82f6'
                                                      : '#333333'
                                            }
                                        >
                                            {String(d.getDate()).padStart(2, ' ')}
                                        </text>
                                    </box>
                                )
                            })}
                        </box>
                    )
                })}
            </box>
        </box>
    )
}

render(<DatePicker  enableColors />) // per @opentui/react Quick Start
