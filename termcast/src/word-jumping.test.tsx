import { describe, test, expect } from 'vitest'
import { nextWordEndCrossLine, previousWordStartCrossLine } from './word-jumping'

describe('word-jumping', () => {
    describe('nextWordEndCrossLine', () => {
        test('jumps to end of current word', () => {
            const text = 'hello| world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello world|"`)
        })

        test('skips spaces to next word end', () => {
            const text = 'hello |  world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello   world|"`)
        })

        test('handles punctuation', () => {
            const text = 'hello|, world!'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toBe('hello, world|!')
        })

        test('handles multiple punctuation', () => {
            const text = 'hello|... world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello...| world"`)
        })

        test('crosses newlines', () => {
            const text = 'hello|\nworld'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`
              "hello
              |world"
            `)
        })

        test('handles multiple newlines', () => {
            const text = 'hello|\n\nworld'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`
              "hello

              world|"
            `)
        })

        test('handles camelCase words', () => {
            const text = 'hello|WorldCase'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"helloWorldCase|"`)
        })

        test('handles snake_case words', () => {
            const text = 'hello|_world_case'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello_world|_case"`)
        })

        test('handles end of text', () => {
            const text = 'hello world|'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello world|"`)
        })

        test('handles complex text with newlines and punctuation', () => {
            const text = 'function| test() {\n    return true;\n}'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = nextWordEndCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`
              "function test|() {
                  return true;
              }"
            `)
        })
    })

    describe('previousWordStartCrossLine', () => {
        test('jumps to start of current word', () => {
            const text = 'hello wor|ld'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello w|orld"`)
        })

        test('skips spaces to previous word start', () => {
            const text = 'hello  |world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"h|ello  world"`)
        })

        test('handles punctuation', () => {
            const text = 'hello, |world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toBe('h|ello, world')
        })

        test('handles multiple punctuation', () => {
            const text = 'hello... |world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello.|.. world"`)
        })

        test('crosses newlines', () => {
            const text = 'hello\n|world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`
              "h|ello
              world"
            `)
        })

        test('handles multiple newlines', () => {
            const text = 'hello\n\n|world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`
              "hello
              |
              world"
            `)
        })

        test('handles camelCase words', () => {
            const text = 'helloWorld|Case'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"h|elloWorldCase"`)
        })

        test('handles snake_case words', () => {
            const text = 'hello_world_|case'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"hello_w|orld_case"`)
        })

        test('handles beginning of text', () => {
            const text = '|hello world'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`"|hello world"`)
        })

        test('handles complex text with newlines and punctuation', () => {
            const text = 'function test() {\n    return| true;\n}'
            const caret = text.indexOf('|')
            const cleanText = text.replace('|', '')
            const result = previousWordStartCrossLine(cleanText, caret)
            expect(cleanText.slice(0, result) + '|' + cleanText.slice(result)).toMatchInlineSnapshot(`
              "function test() {
                  r|eturn true;
              }"
            `)
        })
    })
})