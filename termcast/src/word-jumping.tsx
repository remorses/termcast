const PUNCTUATION = new Set(Array.from(',./\\;:\'"`~!@#$%^&*()-_=+[]{}<>?|?'))

const isWhitespace = (ch: string) => ch === ' ' || ch === '\t'
const isNewline = (ch: string) => ch === '\n' || ch === '\r'
const isPunctuation = (ch: string) => PUNCTUATION.has(ch)
const isWordChar = (ch: string) => /[A-Za-z0-9_]/.test(ch)

type Kind = 'space' | 'punct' | 'word' | 'other'
const kindOf = (ch: string): Kind =>
    isWhitespace(ch)
        ? 'space'
        : isNewline(ch)
          ? 'other'
          : isPunctuation(ch)
            ? 'punct'
            : isWordChar(ch)
              ? 'word'
              : 'other'

const skipWhileRight = (
    text: string,
    i: number,
    pred: (c: string) => boolean,
) => {
    const n = text.length
    while (i < n && pred(text[i])) i++
    return i
}
const skipWhileLeft = (
    text: string,
    i: number,
    pred: (c: string) => boolean,
) => {
    while (i > 0 && pred(text[i - 1])) i--
    return i
}

// Non-trivial: mimic the Rust “first-iteration” behavior — if the very first non-space
// next to the caret is a single punctuation char, skip it once (don’t treat it as a separator).
const skipSingleAdjacentPunctRight = (text: string, i: number) => {
    const n = text.length
    if (
        i < n &&
        isPunctuation(text[i]) &&
        i + 1 < n &&
        !isPunctuation(text[i + 1]) &&
        !isNewline(text[i + 1])
    ) {
        return i + 1
    }
    return i
}
const skipSingleAdjacentPunctLeft = (text: string, i: number) => {
    if (
        i > 0 &&
        isPunctuation(text[i - 1]) &&
        (i - 2 < 0 || (!isPunctuation(text[i - 2]) && !isNewline(text[i - 2])))
    ) {
        return i - 1
    }
    return i
}

const runEndRight = (text: string, i: number, k: Kind) => {
    const n = text.length
    while (i + 1 < n) {
        const nextK = kindOf(text[i + 1])
        if ((k !== nextK && k !== 'space') || isNewline(text[i + 1])) break
        i++
    }
    return Math.min(i + 1, n)
}
const runStartLeft = (text: string, i: number, k: Kind) => {
    while (i - 2 >= 0) {
        const prevK = kindOf(text[i - 2])
        if ((k !== prevK && k !== 'space') || isNewline(text[i - 2])) break
        i--
    }
    return i
}

function nextWordEnd(text: string, caret: number): number {
    const n = text.length
    let i = caret
    i = skipWhileRight(text, i, isWhitespace)
    i = skipSingleAdjacentPunctRight(text, i)
    if (i >= n) return n
    // After skipping punctuation, we might be on a space again
    i = skipWhileRight(text, i, isWhitespace)
    if (i >= n) return n
    const k = kindOf(text[i])
    return runEndRight(text, i, k)
}

function previousWordStart(text: string, caret: number): number {
    let i = caret
    i = skipWhileLeft(text, i, isWhitespace)
    i = skipSingleAdjacentPunctLeft(text, i)
    if (i <= 0) return 0
    // After skipping punctuation, we might be after a space again
    i = skipWhileLeft(text, i, isWhitespace)
    if (i <= 0) return 0
    const k = kindOf(text[i - 1])
    return runStartLeft(text, i, k)
}

export function nextWordEndCrossLine(text: string, caret: number): number {
    let i = nextWordEnd(text, caret)
    if (i < text.length && text[i] === '\n') {
        i++
        i = nextWordEnd(text, i)
    }
    return i
}

export function previousWordStartCrossLine(
    text: string,
    caret: number,
): number {
    let i = previousWordStart(text, caret)
    if (i > 0 && text[i - 1] === '\n') {
        i--
        i = previousWordStart(text, i)
    }
    return i
}
