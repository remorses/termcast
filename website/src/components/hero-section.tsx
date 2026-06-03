/**
 * Full-bleed hero with DottedVideoBackground (Three.js fluid sim), serif title,
 * install CTA, and GitHub link.
 *
 * Breaks out of the Above column constraint via w-screen + negative margin
 * (same pattern as holocron's own hero-section.tsx).
 *
 * Dark mode: pumpkin orange dots on near-black background.
 * Light mode: video is CSS-inverted, dots blend with light background.
 * Gradient overlays use var(--background) so they adapt to theme automatically.
 */
'use client'

import { Github, ArrowDown } from 'lucide-react'
import { InstallCommand } from './install-command.tsx'
import { DottedVideoBackground } from './dotted-video-background.tsx'

const GITHUB_URL = 'https://github.com/remorses/termcast'

// Gradient overlays using var(--background) for theme-adaptive blending.
// Non-linear stops for a smooth cinematic fade.
const TOP_GRADIENT = [
  'linear-gradient(to bottom,',
  'var(--background) 0%,',
  'color-mix(in srgb, var(--background) 90%, transparent) 10%,',
  'color-mix(in srgb, var(--background) 70%, transparent) 22%,',
  'color-mix(in srgb, var(--background) 40%, transparent) 40%,',
  'color-mix(in srgb, var(--background) 15%, transparent) 60%,',
  'transparent 80%)',
].join(' ')

const BOTTOM_GRADIENT = [
  'linear-gradient(to top,',
  'var(--background) 0%,',
  'color-mix(in srgb, var(--background) 85%, transparent) 15%,',
  'color-mix(in srgb, var(--background) 50%, transparent) 35%,',
  'color-mix(in srgb, var(--background) 20%, transparent) 55%,',
  'transparent 75%)',
].join(' ')

export function HeroSection() {
  return (
    <div className='relative mt-4 lg:mt-8 mb-6 lg:mb-10 w-screen ml-[calc(-50vw+50%)] flex flex-col items-center overflow-hidden'>
      {/* Three.js dotted video background */}
      <div
        className='absolute inset-0 w-full h-full z-0 overflow-hidden dark:opacity-60 opacity-40'
        style={{
          maskImage:
            'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 60%, transparent 100%)',
        }}
      >
          <DottedVideoBackground
            className='w-full h-full'
            config={{
              dotColor: '#fe750e',
              dotSize: 6,
              minDotSize: 1,
              dotMargin: 1,
              animSpeed: 3,
              gamma: 0.8,
              enableMask: false,
              fluidStrength: 0.2,
              fluidCurl: 80,
            }}
          />
      </div>

      {/* Top gradient overlay */}
      <div
        className='absolute top-0 inset-x-0 h-[60%] z-[1] pointer-events-none'
        style={{ background: TOP_GRADIENT }}
      />

      {/* Bottom gradient overlay */}
      <div
        className='absolute bottom-0 inset-x-0 h-[40%] z-[1] pointer-events-none'
        style={{ background: BOTTOM_GRADIENT }}
      />

      {/* Foreground content */}
      <div className='relative z-[2] flex flex-col items-center justify-center px-6 pt-16 sm:pt-24 pb-8'>
        <div className='flex flex-col items-center text-center'>
          <h1 className='flex flex-col items-center leading-none'>
            <span
              className='text-[72px] sm:text-[100px] md:text-[120px] font-normal uppercase tracking-tight text-foreground'
              style={{
                fontFamily:
                  "'Playfair Display', Georgia, 'Times New Roman', serif",
              }}
            >
              Raycast
            </span>
            <span
              className='italic text-[48px] sm:text-[64px] md:text-[80px] font-normal text-foreground -mt-2 sm:-mt-3'
              style={{
                fontFamily:
                  "'Playfair Display', Georgia, 'Times New Roman', serif",
              }}
            >
              for the terminal.
            </span>
          </h1>
          <p className='text-foreground/50 text-sm sm:text-base tracking-wide mt-5 sm:mt-6 max-w-2xl'>
            The fastest way to build terminal apps. React components,
            Raycast-compatible API,
            <br className='hidden sm:block' /> compile to a single binary.
            Already have a Raycast extension? Port it.
          </p>
          <InstallCommand />
          <div className='flex items-center gap-5 mt-4'>
            <a
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 text-[13px] font-mono text-foreground/70 hover:text-foreground transition-colors'
              href={GITHUB_URL}
            >
              <Github size={14} />
              View on GitHub
            </a>
          </div>
          <a
            href='#overview'
            className='mt-10 mb-4 flex flex-col items-center gap-1 text-[11px] font-mono text-foreground/30 hover:text-foreground/60 transition-colors'
          >
            Learn more
            <ArrowDown size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
