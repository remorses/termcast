import { useKeyboard } from '@opentui/react'
import { useMemo, useState, useRef } from 'react'
import Theme from '../theme'

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
  weekStartsOnMonday = true,
): Date[][] {
  // Strategy: 7x6 grid, include prev/next month days to fill 42 cells
  const first = startOfMonth(viewDate)
  const firstWeekday = first.getDay() // 0=Sun..6=Sat
  // For Monday start: Mon=0, Tue=1, ..., Sun=6
  const offset = weekStartsOnMonday ? (firstWeekday + 6) % 7 : firstWeekday
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
export function DatePickerWidget({
  enableColors = true,
  initialValue,
  onChange,
  focused = false,
  onFirstRowUpKey,
  onLastRowDownKey,
}: {
  enableColors?: boolean
  initialValue?: Date
  onChange?: (date: Date) => void
  focused?: boolean
  onFirstRowUpKey?: () => void
  onLastRowDownKey?: () => void
}) {
  const today = useMemo(() => new Date(), [])
  const [focus, setFocus] = useState<Focus>('grid') // can be "year" | "month" | "grid"
  const [selected, setSelected] = useState<Date>(initialValue || new Date()) // focused day
  const [visible, setVisible] = useState<Date>(
    startOfMonth(initialValue || new Date()),
  ) // month being shown
  const [searchQuery, setSearchQuery] = useState('') // for type-to-search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Recompute 7x6 grid for the visible month (Monday start)
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
    const matches = years.filter((y) => y.toString().startsWith(query))
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
    // Ignore keyboard events if not focused
    if (!focused) return
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
          // Check if we're in the first row of the month
          const firstDayOfMonth = new Date(
            selected.getFullYear(),
            selected.getMonth(),
            1,
          )
          const daysDiff = selected.getDate() - 1
          if (daysDiff < 7) {
            // Move focus to month
            setFocus('month')
          } else {
            const next = addDays(selected, -7)
            setSelected(next)
            ensureVisibleFor(next)
          }
        } else if (focus === 'month') {
          // Move focus to year
          setFocus('year')
        } else if (focus === 'year') {
          // At top of widget, trigger callback or cycle to bottom
          if (onFirstRowUpKey) {
            onFirstRowUpKey()
          } else {
            // Cycle to grid if no callback
            setFocus('grid')
          }
        }
        break
      case 'down':
        if (focus === 'grid') {
          // Check if we're in the last row of days
          const daysInCurrentMonth = daysInMonth(
            selected.getFullYear(),
            selected.getMonth(),
          )
          const remainingDays = daysInCurrentMonth - selected.getDate()
          if (remainingDays < 7) {
            // At bottom of grid, trigger callback or cycle to top
            if (onLastRowDownKey) {
              onLastRowDownKey()
            } else {
              // Cycle to year if no callback
              setFocus('year')
            }
          } else {
            const next = addDays(selected, +7)
            setSelected(next)
            ensureVisibleFor(next)
          }
        } else if (focus === 'year') {
          // Move focus to month
          setFocus('month')
        } else if (focus === 'month') {
          // Move focus to grid
          setFocus('grid')
        }
        break
      case 'tab':
        if (key.shift) {
          if (focus === 'year') {
            // At top of widget, trigger callback or cycle to bottom
            if (onFirstRowUpKey) {
              onFirstRowUpKey()
            } else {
              // Cycle to grid if no callback
              setFocus('grid')
            }
          } else {
            // Shift+Tab: Move focus up (grid -> month -> year)
            setFocus((f) =>
              f === 'grid' ? 'month' : f === 'month' ? 'year' : 'year',
            )
          }
        } else {
          if (focus === 'grid') {
            // At bottom of widget, trigger callback or cycle to top
            if (onLastRowDownKey) {
              onLastRowDownKey()
            } else {
              // Cycle to year if no callback
              setFocus('year')
            }
          } else {
            // Tab: Move focus down (year -> month -> grid)
            setFocus((f) =>
              f === 'year' ? 'month' : f === 'month' ? 'grid' : 'grid',
            )
          }
        }
        break
      case 'return': // Enter key
      case 'space': // Space key
        if (focus === 'grid' && onChange) {
          onChange(selected)
        }
        break
      default:
        break
    }
  })

  const y = visible.getFullYear()
  const m = visible.getMonth()
  const headerWidth = 21 // Match form.md width (7 cols * 3 width)
  const cellStyle = {
    width: 3,
    height: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }

  // Only show days from current month
  const filteredWeeks = weeks.map((row) =>
    row.map((d) => (d.getMonth() === m ? d : null)),
  )

  // Week starts Monday: Mo Tu We Th Fr Sa Su
  const weekdayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  return (
    <box
      style={{
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      {/* Year (line 1) */}
      <box
        style={{
          width: headerWidth,
          height: 1,
          backgroundColor:
            enableColors && focus === 'year' ? Theme.primary : undefined,
          marginBottom: 0,
        }}
        onMouseDown={() => setFocus('year')}
      >
        <box
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: headerWidth,
          }}
        >
          <text fg={focus === 'year' ? Theme.text : Theme.textMuted}>←</text>
          <text fg={focus === 'year' ? Theme.text : Theme.textMuted}>
            {String(y)}
          </text>
          <text fg={focus === 'year' ? Theme.text : Theme.textMuted}>→</text>
        </box>
      </box>

      {/* Month (line 2) */}
      <box
        style={{
          width: headerWidth,
          height: 1,
          backgroundColor:
            enableColors && focus === 'month' ? Theme.primary : undefined,
          marginBottom: 1,
        }}
        onMouseDown={() => setFocus('month')}
      >
        <box
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: headerWidth,
          }}
        >
          <text fg={focus === 'month' ? Theme.text : Theme.textMuted}>←</text>
          <text fg={focus === 'month' ? Theme.text : Theme.textMuted}>
            {MONTHS[m]}
          </text>
          <text fg={focus === 'month' ? Theme.text : Theme.textMuted}>→</text>
        </box>
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
        {weekdayHeaders.map((wd, idx) => (
          <box key={wd} style={cellStyle}>
            <text
              fg={
                enableColors && (idx === 5 || idx === 6)
                  ? Theme.error
                  : Theme.textMuted
              }
            >
              {wd}
            </text>
          </box>
        ))}
      </box>

      {/* Days grid: 7 columns x 6 rows, same fixed-box strategy */}
      <box style={{ flexDirection: 'column' }}>
        {filteredWeeks.map((row, i) => {
          // Skip empty rows
          if (row.every((d) => d === null)) return null

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
                        enableColors && isSel
                          ? Theme.primary
                          : enableColors && isToday
                            ? Theme.backgroundPanel
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
                        isSel
                          ? Theme.text
                          : enableColors && isToday
                            ? Theme.accent
                            : enableColors && (j === 5 || j === 6)
                              ? Theme.error
                              : Theme.text
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
