/**
 * AI API - Interface for AI model interactions
 *
 * Raycast Docs: https://developers.raycast.com/api-reference/ai
 *
 * The AI namespace provides methods to interact with various AI models for
 * generating text completions. It supports streaming responses and multiple
 * model providers including OpenAI, Anthropic, Google, and others.
 *
 * Key features:
 * - Stream text completions with AI.ask()
 * - Support for multiple AI models via Model enum
 * - Configurable creativity levels
 * - Abort signal support for cancellation
 * - Event-based streaming with "data" events
 *
 * Usage:
 * const stream = AI.ask("Explain quantum computing")
 * stream.on("data", (chunk) => console.log(chunk))
 * const result = await stream
 *
 * Models include GPT-4, Claude, Gemini, Llama, Mistral, and many others.
 * Creativity can be set from "none" to "maximum" or as a number 0-2.
 */

import { EventEmitter } from 'node:events'
import { logger } from '@termcast/cli/src/logger'

export namespace AI {
    export type Creativity =
        | 'none'
        | 'low'
        | 'medium'
        | 'high'
        | 'maximum'
        | number

    export enum Model {
        OpenAI_GPT4 = 'openai-gpt-4',
        'OpenAI_GPT4-turbo' = 'openai-gpt-4-turbo',
        'OpenAI_GPT4.1' = 'openai-gpt-4.1',
        'OpenAI_GPT4.1-nano' = 'openai-gpt-4.1-nano',
        'OpenAI_GPT4.1-mini' = 'openai-gpt-4.1-mini',
        OpenAI_GPT4o = 'openai-gpt-4o',
        'OpenAI_GPT4o-mini' = 'openai-gpt-4o-mini',
        'OpenAI_o3-mini' = 'openai_o1-o3-mini',
        'OpenAI_o4-mini' = 'openai_o1-o4-mini',
        OpenAI_o1 = 'openai_o1-o1',
        OpenAI_o3 = 'openai_o1-o3',
        Anthropic_Claude_Haiku = 'anthropic-claude-haiku',
        Anthropic_Claude_Opus = 'anthropic-claude-opus',
        Anthropic_Claude_Sonnet = 'anthropic-claude-sonnet',
        'Anthropic_Claude_Sonnet_3.7' = 'anthropic-claude-3-7-sonnet-latest',
        Anthropic_Claude_4_Sonnet = 'anthropic-claude-sonnet-4',
        Anthropic_Claude_4_Opus = 'anthropic-claude-opus-4',
        Mistral_Nemo = 'mistral-nemo',
        Mistral_Large = 'mistral-large',
        Mistral_Medium = 'mistral-mistral-medium-latest',
        Mistral_Small = 'mistral-small',
        Mistral_Codestral = 'mistral-codestral',
        'Llama3.3_70B' = 'groq-llama-3.3-70b-versatile',
        'Llama3.1_8B' = 'llama3.1-8b',
        'Llama3.1_405B' = 'llama3.1-405b',
        'Llama4_Scout' = 'groq-meta-llama/llama-4-scout-17b-16e-instruct',
        Perplexity_Sonar = 'perplexity-sonar',
        Perplexity_Sonar_Pro = 'perplexity-sonar-pro',
        Perplexity_Sonar_Reasoning = 'perplexity-sonar-reasoning',
        Perplexity_Sonar_Reasoning_Pro = 'perplexity-sonar-reasoning-pro',
        DeepSeek_R1 = 'together-deepseek-ai/DeepSeek-R1',
        DeepSeek_V3 = 'together-deepseek-ai/DeepSeek-V3',
        'DeepSeek_R1_Distill_Llama_3.3_70B' = 'groq-deepseek-r1-distill-llama-70b',
        'Google_Gemini_2.0_Flash' = 'google-gemini-2.0-flash',
        'Google_Gemini_2.0_Flash_Thinking' = 'google-gemini-2.0-flash-thinking',
        'Google_Gemini_2.5_Flash' = 'google-gemini-2.5-flash',
        'Google_Gemini_2.5_Pro' = 'google-gemini-2.5-pro',
        xAI_Grok_2 = 'xai-grok-2-latest',
        xAI_Grok_3 = 'xai-grok-3',
        xAI_Grok_3_Mini = 'xai-grok-3-mini',
        // Deprecated models
        'OpenAI_GPT3.5-turbo-instruct' = 'openai-gpt-4o-mini',
        Llama2_70B = 'llama2-70b',
        Perplexity_Sonar_Medium_Online = 'perplexity-sonar',
        Perplexity_Sonar_Small_Online = 'perplexity-sonar',
        Codellama_70B_instruct = 'codellama-70b-instruct',
        Perplexity_Llama3_Sonar_Large = 'perplexity-sonar',
        Perplexity_Llama3_Sonar_Small = 'perplexity-sonar',
        'OpenAI_GPT3.5-turbo' = 'openai-gpt-4o-mini',
        'Llama3.1_70B' = 'groq-llama-3.3-70b-versatile',
        'Perplexity_Llama3.1_Sonar_Huge' = 'perplexity-sonar-pro',
        'Perplexity_Llama3.1_Sonar_Large' = 'perplexity-sonar',
        'Perplexity_Llama3.1_Sonar_Small' = 'perplexity-sonar',
        'Mistral_Large2' = 'mistral-large',
        'Groq_DeepSeek_R1_Distill_Llama_3.3_70B' = 'groq-deepseek-r1-distill-llama-70b',
        'Together_DeepSeek_R1' = 'together-deepseek-ai/DeepSeek-R1',
        'MixtraL_8x7B' = 'mistral-nemo',
        'Google_Gemini_1.5_Flash' = 'google-gemini-1.5-flash',
        'Google_Gemini_1.5_Pro' = 'google-gemini-2.0-flash',
        Mixtral_8x7B = 'mistral-nemo',
        'Qwen_2.5_32B' = 'openai-gpt-4o-mini',
        'OpenAI_o1-preview' = 'openai_o1-o1',
        'OpenAI_o1-mini' = 'openai_o1-o1-mini',
        Llama3_70B = 'llama3-70b',
    }

    export type __DeprecatedModelUnion =
        | 'openai-gpt-3.5-turbo-instruct'
        | 'openai-gpt-3.5-turbo'
        | 'openai-gpt-4'
        | 'openai-gpt-4-turbo'
        | 'anthropic-claude-haiku'
        | 'anthropic-claude-opus'
        | 'anthropic-claude-sonnet'
        | 'perplexity-sonar-medium-online'
        | 'perplexity-sonar-small-online'
        | 'llama2-70b'
        | 'mixtral-8x7b'
        | 'codellama-70b-instruct'
        | 'gpt-3.5-turbo'
        | 'gpt-3.5-turbo-instruct'
        | 'gpt-4'
        | 'text-davinci-003'

    export type AskOptions = {
        creativity?: Creativity
        model?: Model | __DeprecatedModelUnion
        signal?: AbortSignal
    }

    interface AskStream extends Promise<string> {
        on(event: 'data', listener: (chunk: string) => void): void
    }

    export function ask(prompt: string, options?: AskOptions): AskStream {
        logger.log('AI.ask called', { prompt, options })

        const emitter = new EventEmitter()
        let result = ''

        // TODO: Implement real AI integration
        // This is a simulated response - in production, this should:
        // 1. Connect to actual AI providers (OpenAI, Anthropic, etc.)
        // 2. Use the specified model from options.model
        // 3. Apply creativity/temperature settings from options.creativity
        // 4. Handle proper streaming from the AI service
        const simulateResponse = async () => {
            const response = `I understand you're asking: "${prompt}". As a simulated AI in termcast, I cannot provide real AI responses. To use AI functionality, you would need to integrate with an actual AI service provider.`

            // TODO: Replace with real streaming from AI provider
            // Emit response in chunks to simulate streaming
            const words = response.split(' ')
            for (const word of words) {
                if (options?.signal?.aborted) {
                    break
                }
                const chunk = word + ' '
                result += chunk
                emitter.emit('data', chunk)
                await new Promise((resolve) => setTimeout(resolve, 50))
            }

            return result.trim()
        }

        const promise = simulateResponse()

        // Create an object that is both a Promise and has an `on` method
        const stream: AskStream = Object.assign(promise, {
            on: (event: string, listener: (chunk: string) => void) => {
                if (event === 'data') {
                    emitter.on('data', listener)
                }
            },
        })

        return stream
    }
}
