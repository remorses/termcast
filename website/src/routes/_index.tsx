/**
 * Recreation of browser-use.com landing page.
 * Dark theme with pumpkin orange accent, serif headings (Playfair Display),
 * mono body text, animated logo carousel, and product showcase cards.
 */
import 'website/src/styles/browseruse.css'
import { Github, ChevronDown, Menu, ArrowDown } from 'lucide-react'

const CLOUD_URL = 'https://cloud.browser-use.com'
const GITHUB_URL = 'https://github.com/browser-use/browser-use'
const DOCS_URL = 'https://docs.cloud.browser-use.com'

// ─── Company logos for the "Trusted by" carousel ────────────────────────────
// Each logo is a unique SVG with distinct shape + type treatment

function KimakiLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='kimaki.xyz' className='w-full h-full'>
      {/* Hexagon mark */}
      <polygon points='18,8 28,3 38,8 38,20 28,25 18,20' fill='none' stroke='#71717A' strokeWidth='1.8' />
      <circle cx='28' cy='14' r='4' fill='#71717A' />
      <text x='48' y='19' fill='#71717A' fontSize='14' fontFamily='"Courier New", monospace' fontWeight='700' letterSpacing='1'>kimaki</text>
      <text x='48' y='31' fill='#52525b' fontSize='9' fontFamily='"Courier New", monospace'>.xyz</text>
    </svg>
  )
}

function UnframerLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='unframer.co' className='w-full h-full'>
      {/* Broken frame mark — two L-shaped corners that don't connect */}
      <path d='M14,6 L14,22 L26,22' fill='none' stroke='#71717A' strokeWidth='2' strokeLinecap='round' />
      <path d='M38,6 L38,22 L26,22' fill='none' stroke='#71717A' strokeWidth='2' strokeLinecap='round' strokeDasharray='3 3' />
      <text x='48' y='20' fill='#71717A' fontSize='15' fontFamily='Georgia, serif' fontStyle='italic' fontWeight='400'>unframer</text>
      <text x='119' y='20' fill='#52525b' fontSize='9' fontFamily='Georgia, serif'>.co</text>
    </svg>
  )
}

function PlaywriterLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='playwriter.dev' className='w-full h-full'>
      {/* Terminal cursor / play triangle */}
      <rect x='12' y='6' width='24' height='18' rx='3' fill='none' stroke='#71717A' strokeWidth='1.6' />
      <polygon points='20,11 20,19 27,15' fill='#71717A' />
      <text x='46' y='19' fill='#71717A' fontSize='13' fontFamily='system-ui, -apple-system, sans-serif' fontWeight='600' letterSpacing='-0.5'>playwriter</text>
      <text x='46' y='30' fill='#52525b' fontSize='8' fontFamily='system-ui, -apple-system, sans-serif'>.dev</text>
    </svg>
  )
}

function AcmeCorpLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Acme Corp' className='w-full h-full'>
      {/* Triangle A mark */}
      <polygon points='24,4 38,24 10,24' fill='none' stroke='#71717A' strokeWidth='1.8' strokeLinejoin='round' />
      <line x1='17' y1='17' x2='31' y2='17' stroke='#71717A' strokeWidth='1.2' />
      <text x='46' y='20' fill='#71717A' fontSize='15' fontFamily='"Helvetica Neue", Arial, sans-serif' fontWeight='800' letterSpacing='2' textTransform='uppercase'>ACME</text>
    </svg>
  )
}

function NovaSoftLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='NovaSoft' className='w-full h-full'>
      {/* Star burst */}
      <circle cx='22' cy='14' r='8' fill='none' stroke='#71717A' strokeWidth='1.4' />
      <circle cx='22' cy='14' r='2.5' fill='#71717A' />
      <line x1='22' y1='4' x2='22' y2='6' stroke='#71717A' strokeWidth='1.2' />
      <line x1='22' y1='22' x2='22' y2='24' stroke='#71717A' strokeWidth='1.2' />
      <line x1='12' y1='14' x2='14' y2='14' stroke='#71717A' strokeWidth='1.2' />
      <line x1='30' y1='14' x2='32' y2='14' stroke='#71717A' strokeWidth='1.2' />
      <text x='40' y='19' fill='#71717A' fontSize='14' fontFamily='Georgia, serif' fontWeight='400'>NovaSoft</text>
    </svg>
  )
}

function VectorLabsLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='VectorLabs' className='w-full h-full'>
      {/* Arrow / vector mark */}
      <path d='M10,22 L24,6 L38,22' fill='none' stroke='#71717A' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      <line x1='24' y1='6' x2='24' y2='26' stroke='#71717A' strokeWidth='1.6' />
      <text x='46' y='18' fill='#71717A' fontSize='12' fontFamily='system-ui, sans-serif' fontWeight='700' letterSpacing='3'>VECTOR</text>
      <text x='46' y='28' fill='#52525b' fontSize='9' fontFamily='system-ui, sans-serif' fontWeight='300' letterSpacing='3'>LABS</text>
    </svg>
  )
}

function PulseIOLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Pulse.io' className='w-full h-full'>
      {/* Heartbeat / pulse line */}
      <polyline points='8,16 16,16 20,6 24,26 28,12 32,16 40,16' fill='none' stroke='#71717A' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
      <text x='48' y='20' fill='#71717A' fontSize='15' fontFamily='"SF Mono", "Courier New", monospace' fontWeight='500'>pulse</text>
      <text x='100' y='20' fill='#52525b' fontSize='15' fontFamily='"SF Mono", "Courier New", monospace' fontWeight='300'>.io</text>
    </svg>
  )
}

function SkylineAILogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Skyline AI' className='w-full h-full'>
      {/* City skyline blocks */}
      <rect x='10' y='12' width='5' height='14' fill='#71717A' rx='0.5' />
      <rect x='17' y='6' width='5' height='20' fill='#71717A' rx='0.5' />
      <rect x='24' y='9' width='5' height='17' fill='#71717A' rx='0.5' />
      <rect x='31' y='14' width='5' height='12' fill='#71717A' rx='0.5' />
      <rect x='38' y='10' width='5' height='16' fill='#71717A' rx='0.5' />
      <text x='52' y='20' fill='#71717A' fontSize='13' fontFamily='"Helvetica Neue", Arial, sans-serif' fontWeight='300' letterSpacing='1'>Skyline AI</text>
    </svg>
  )
}

function CraftBaseLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='CraftBase' className='w-full h-full'>
      {/* Layered squares */}
      <rect x='12' y='8' width='14' height='14' rx='2' fill='none' stroke='#71717A' strokeWidth='1.4' />
      <rect x='20' y='14' width='14' height='14' rx='2' fill='none' stroke='#71717A' strokeWidth='1.4' />
      <text x='44' y='20' fill='#71717A' fontSize='13' fontFamily='"Courier New", monospace' fontWeight='400'>CraftBase</text>
    </svg>
  )
}

function ZenithLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Zenith' className='w-full h-full'>
      {/* Z mark with underline */}
      <path d='M12,8 L32,8 L12,24 L32,24' fill='none' stroke='#71717A' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' />
      <text x='42' y='20' fill='#71717A' fontSize='16' fontFamily='Georgia, serif' fontWeight='700'>Zenith</text>
    </svg>
  )
}

function OrbitalLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Orbital' className='w-full h-full'>
      {/* Orbit rings */}
      <ellipse cx='22' cy='14' rx='12' ry='6' fill='none' stroke='#71717A' strokeWidth='1.2' transform='rotate(-20 22 14)' />
      <ellipse cx='22' cy='14' rx='12' ry='6' fill='none' stroke='#71717A' strokeWidth='1.2' transform='rotate(20 22 14)' />
      <circle cx='22' cy='14' r='2' fill='#71717A' />
      <text x='42' y='19' fill='#71717A' fontSize='14' fontFamily='system-ui, sans-serif' fontWeight='500' letterSpacing='-0.3'>Orbital</text>
    </svg>
  )
}

function HelixLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Helix' className='w-full h-full'>
      {/* DNA helix strands */}
      <path d='M14,4 C22,10 22,18 14,24' fill='none' stroke='#71717A' strokeWidth='1.6' />
      <path d='M30,4 C22,10 22,18 30,24' fill='none' stroke='#71717A' strokeWidth='1.6' />
      <line x1='17' y1='9' x2='27' y2='9' stroke='#71717A' strokeWidth='1' />
      <line x1='16' y1='14' x2='28' y2='14' stroke='#71717A' strokeWidth='1' />
      <line x1='17' y1='19' x2='27' y2='19' stroke='#71717A' strokeWidth='1' />
      <text x='40' y='19' fill='#71717A' fontSize='16' fontFamily='"Helvetica Neue", Arial, sans-serif' fontWeight='200' letterSpacing='4'>HELIX</text>
    </svg>
  )
}

function FluxDevLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Flux' className='w-full h-full'>
      {/* Wave / flow mark */}
      <path d='M8,18 C14,6 20,26 26,14 C32,2 38,22 44,10' fill='none' stroke='#71717A' strokeWidth='2' strokeLinecap='round' />
      <text x='52' y='19' fill='#71717A' fontSize='15' fontFamily='Georgia, "Times New Roman", serif' fontWeight='700' fontStyle='italic'>flux</text>
      <text x='82' y='19' fill='#52525b' fontSize='10' fontFamily='Georgia, serif'>.dev</text>
    </svg>
  )
}

function AtlasLogo() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50' aria-label='Atlas' className='w-full h-full'>
      {/* Globe with meridians */}
      <circle cx='22' cy='14' r='10' fill='none' stroke='#71717A' strokeWidth='1.4' />
      <ellipse cx='22' cy='14' rx='5' ry='10' fill='none' stroke='#71717A' strokeWidth='0.8' />
      <line x1='12' y1='14' x2='32' y2='14' stroke='#71717A' strokeWidth='0.8' />
      <text x='40' y='19' fill='#71717A' fontSize='14' fontFamily='system-ui, sans-serif' fontWeight='800' letterSpacing='1.5'>ATLAS</text>
    </svg>
  )
}

const LOGO_COMPONENTS = [
  KimakiLogo,
  UnframerLogo,
  PlaywriterLogo,
  AcmeCorpLogo,
  NovaSoftLogo,
  VectorLabsLogo,
  PulseIOLogo,
  SkylineAILogo,
  CraftBaseLogo,
  ZenithLogo,
  OrbitalLogo,
  HelixLogo,
  FluxDevLogo,
  AtlasLogo,
]

function LogoCarousel() {
  return (
    <div className='mt-10 sm:mt-12 w-screen max-w-3xl'>
      <div className='text-center pb-3'>
        <span className='text-[10px] bu-font-mono text-zinc-600 tracking-wide'>
          Trusted by teams at
        </span>
      </div>
      <div className='overflow-hidden relative'>
        <div className='absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none' />
        <div className='absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none' />
        <div
          style={{ width: '7840px' }}
          className='flex items-center animate-logo-scroll-compact will-change-transform'
        >
          {/* Render twice for seamless infinite loop */}
          {[...LOGO_COMPONENTS, ...LOGO_COMPONENTS].map((Logo, i) => (
            <div key={i} className='flex-shrink-0 flex items-center justify-center w-[180px] h-[48px] px-4 opacity-30'>
              <Logo />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Navigation ─────────────────────────────────────────────────────────────

const NAV_LINK =
  'text-[13px] text-white/50 hover:text-white/90 transition-colors duration-150'

function Header() {
  return (
    <div className='h-[52px]'>
      <header className='w-full fixed top-0 left-0 right-0 z-50 h-[52px] bg-page-bg'>
        <div className='flex items-center justify-between h-full px-6 lg:px-20 xl:px-28'>
          {/* Logo */}
          <a className='flex items-center gap-2.5 group' href='/'>
            <BrowserUseLogo />
            <span className='text-[15px] font-bold text-white tracking-[-0.01em]'>
              Browser Use
            </span>
          </a>

          {/* Center nav */}
          <div className='hidden lg:flex items-center justify-center gap-7 absolute left-1/2 -translate-x-1/2'>
            <a className={NAV_LINK} href='/pricing'>
              Pricing
            </a>
            <button className={`flex items-center gap-1 ${NAV_LINK}`}>
              Products
              <ChevronDown size={12} />
            </button>
            <a className={NAV_LINK} href='/posts'>
              Blog
            </a>
            <button className={`flex items-center gap-1 ${NAV_LINK}`}>
              Resources
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Right side */}
          <div className='hidden lg:flex items-center gap-5'>
            <a
              className='flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/80 transition-colors'
              target='_blank'
              rel='noopener noreferrer'
              href={GITHUB_URL}
            >
              <Github size={16} />
              <span>78,509</span>
            </a>
            <a
              target='_blank'
              rel='noopener noreferrer'
              className='h-8 px-5 text-[13px] font-medium bg-pumpkin-500 text-zinc-950 flex items-center justify-center hover:bg-pumpkin-400 transition-colors'
              href={CLOUD_URL}
            >
              Get Started
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className='flex lg:hidden items-center gap-2'>
            <button
              aria-label='Open menu'
              className='p-2 text-white/50 hover:text-white/90 transition-colors'
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <div className='relative z-10 flex flex-col h-[calc(100vh-52px)]'>
      <div className='flex-1 flex flex-col items-center justify-center px-6'>
        <div className='flex flex-col items-center text-center -mt-20 sm:-mt-16'>
          <h1 className='flex flex-col items-center leading-none'>
            <span className='bu-font-serif text-[72px] sm:text-[100px] md:text-[120px] font-normal uppercase tracking-tight text-white'>
              The Way AI
            </span>
            <span className='bu-font-serif italic text-[48px] sm:text-[64px] md:text-[80px] font-normal text-white -mt-2 sm:-mt-3'>
              uses the web.
            </span>
          </h1>
          <p className='text-zinc-500 bu-font-sans text-sm sm:text-base tracking-wide mt-5 sm:mt-6 max-w-2xl'>
            Agents at scale. Undetectable browsers. Purpose-built models.
            <br className='hidden sm:block' /> The API for any website.
          </p>
          <a
            target='_blank'
            rel='noopener noreferrer'
            className='btn-primary btn-primary-md mt-7 sm:mt-8'
            href={CLOUD_URL}
          >
            Get Started Free
          </a>
          <LogoCarousel />
        </div>
        <a
          href='#products'
          className='mt-8 flex flex-col items-center gap-1 text-[11px] bu-font-mono text-zinc-600 hover:text-zinc-400 transition-colors'
        >
          Learn more
          <ArrowDown size={12} />
        </a>
      </div>
    </div>
  )
}

// ─── Product cards ──────────────────────────────────────────────────────────

function ProductCard({
  href,
  title,
  description,
  visual,
  reversed = false,
}: {
  href: string
  title: string
  description: string
  visual: React.ReactNode
  reversed?: boolean
}) {
  return (
    <a
      target='_blank'
      rel='noopener noreferrer'
      className='group grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center'
      href={href}
    >
      <div className={reversed ? 'order-1 md:order-2' : 'order-1 md:order-1'}>
        <h3 className='bu-font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-white group-hover:text-zinc-300 transition-colors'>
          {title}
        </h3>
        <p className='bu-font-sans text-sm sm:text-base text-zinc-500 mt-4'>
          {description}
        </p>
      </div>
      <div
        className={`${reversed ? 'order-2 md:order-1' : 'order-2 md:order-2'} max-h-[320px] md:max-h-none overflow-hidden relative`}
      >
        {visual}
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-page-bg to-transparent pointer-events-none md:hidden' />
      </div>
    </a>
  )
}

function WebAgentsVisual() {
  const tabs = ['EXTRACTION', 'AUTOMATION', 'QA TESTING', 'MONITORING']
  const activeTab = 'AUTOMATION'
  const results = [
    '{ step: "navigate to cart", status: "done" }',
    '{ step: "fill shipping form", status: "done" }',
    '{ step: "enter payment info", status: "done" }',
    '{ step: "confirm order", status: "done" }',
  ]

  return (
    <div className='relative min-h-[280px] md:min-h-0'>
      <div className='bu-font-mono text-xs sm:text-sm leading-loose'>
        <div className='flex gap-3 sm:gap-4 mb-4 text-[10px] sm:text-xs tracking-wider'>
          {tabs.map((tab) => (
            <button
              key={tab}
              type='button'
              className={`cursor-pointer transition-colors duration-300 ${
                tab === activeTab
                  ? 'text-pumpkin-500'
                  : 'text-zinc-700 hover:text-zinc-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className='text-zinc-400'>
          {'>'} "Fill out my loan application"
        </div>
        <div className='text-pumpkin-500/60 mt-1 transition-opacity duration-200'>
          ↓
        </div>
        {results.map((result) => (
          <div
            key={result}
            className='text-pumpkin-400/80 transition-colors duration-300'
          >
            {result}
          </div>
        ))}
        <div className='text-zinc-800'>···</div>
        <div className='text-zinc-800'>···</div>
      </div>
      <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none' />
    </div>
  )
}

function StealthBrowsersVisual() {
  const fingerprint = [
    { key: 'proxy location', value: 'residential', color: 'text-emerald-500/70' },
    { key: 'navigator.webdriver', value: 'false', color: 'text-emerald-300' },
    { key: 'canvas fingerprint', value: '···', color: 'text-zinc-800' },
    { key: 'webgl renderer', value: '···', color: 'text-zinc-800' },
  ]
  const bypass = [
    { key: 'flarecloud', value: '···', color: 'text-zinc-800' },
    { key: 'domedata', value: '···', color: 'text-zinc-800' },
    { key: 'captcha-re', value: '···', color: 'text-zinc-800' },
  ]

  return (
    <div className='bu-font-mono text-xs sm:text-sm leading-relaxed relative max-w-[340px] min-h-[280px] md:min-h-0'>
      <div className='text-zinc-600 text-[10px] sm:text-xs mb-3 tracking-wider'>
        FINGERPRINT SCAN
      </div>
      {fingerprint.map((row) => (
        <div key={row.key} className='flex items-center justify-between'>
          <span className={row.value === '···' ? 'text-zinc-800' : 'text-zinc-400'}>
            {row.key}
          </span>
          <span className={`${row.color} transition-colors duration-300`}>
            {row.value}
          </span>
        </div>
      ))}
      <div className='text-zinc-600 text-[10px] sm:text-xs mt-4 mb-3 tracking-wider'>
        PROTECTION BYPASS
      </div>
      {bypass.map((row) => (
        <div key={row.key} className='flex items-center justify-between'>
          <span className='text-zinc-800'>{row.key}</span>
          <span className='text-zinc-800'>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function CustomModelsVisual() {
  const models = [
    { name: 'sonnet 4.5', score: 2, width: '3.37%', highlight: false },
    { name: 'gemini flash', score: 17, width: '32%', highlight: false },
    { name: 'bu', score: 47, width: '89.3%', highlight: true },
  ]

  return (
    <div className='bu-font-mono text-xs sm:text-sm leading-relaxed relative max-w-[320px] min-h-[180px] md:min-h-0'>
      <div className='text-zinc-600 text-[10px] sm:text-xs mb-3 tracking-wider'>
        TASKS PER $1
      </div>
      {models.map((model) => (
        <div key={model.name} className='mb-2.5'>
          <div className='flex items-center justify-between mb-1'>
            <span className={model.highlight ? 'text-pumpkin-500' : 'text-zinc-500'}>
              {model.name}
            </span>
            <span
              className={`tabular-nums ${model.highlight ? 'text-pumpkin-400 font-bold' : 'text-zinc-600'}`}
            >
              {model.score}
            </span>
          </div>
          <div className='w-full h-2.5 bg-zinc-800/60 relative overflow-hidden'>
            <div
              className={`absolute inset-y-0 left-0 ${model.highlight ? 'bg-pumpkin-500' : 'bg-zinc-600'}`}
              style={{ width: model.width }}
            />
            {model.highlight && (
              <div
                className='absolute top-0 right-0 h-full w-6 bg-gradient-to-r from-transparent to-pumpkin-300/40 blur-sm'
                style={{ right: `${100 - parseFloat(model.width)}%` }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillAPIsVisual() {
  const responses = [
    { body: '→ { price: "$29.99", stock: true }', latency: '48ms' },
    { body: '→ { price: "$14.50", stock: true }', latency: '51ms' },
    { body: '→ { price: "$42.00", stock: true }', latency: '47ms' },
  ]

  return (
    <div className='bu-font-mono text-xs sm:text-sm leading-loose relative text-left min-h-[160px] md:min-h-0'>
      <div className='text-zinc-400'>
        POST <span className='text-pumpkin-500/70'>/skill/price-check</span>
      </div>
      {responses.map((r) => (
        <div
          key={r.latency}
          className='flex items-center justify-between text-pumpkin-400/80 transition-colors duration-300'
        >
          <span>{r.body}</span>
          <span className='text-zinc-600 transition-opacity duration-300'>
            {r.latency}
          </span>
        </div>
      ))}
    </div>
  )
}

function Products() {
  return (
    <section id='products' className='relative z-10 py-16 sm:py-40 px-6'>
      <div className='max-w-5xl mx-auto flex flex-col gap-20 sm:gap-52'>
        <ProductCard
          href={CLOUD_URL}
          title='Web Agents'
          description='Extract, automate, test, and monitor — in natural language.'
          visual={<WebAgentsVisual />}
        />
        <ProductCard
          href={CLOUD_URL}
          title='Stealth Browsers'
          description='Anti-detect, CAPTCHA solving, 195+ country proxies. Zero config.'
          visual={<StealthBrowsersVisual />}
          reversed
        />
        <ProductCard
          href={`${DOCS_URL}/get-started/models-and-pricing`}
          title='Custom Models'
          description='LLMs purpose-built for browser automation.'
          visual={<CustomModelsVisual />}
        />
        <ProductCard
          href={CLOUD_URL}
          title='Skill APIs'
          description='Any website becomes a reliable API endpoint. Create once, call forever.'
          visual={<SkillAPIsVisual />}
          reversed
        />
      </div>
    </section>
  )
}

// ─── Bottom CTA ─────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <section className='relative z-10 py-12 sm:py-32 px-6'>
      <div className='flex flex-col items-center text-center'>
        <h2 className='bu-font-serif italic text-3xl sm:text-4xl md:text-5xl text-white'>
          Start building.
        </h2>
        <a
          target='_blank'
          rel='noopener noreferrer'
          className='btn-primary btn-primary-md mt-8'
          href={CLOUD_URL}
        >
          Get Started Free
        </a>
      </div>
    </section>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Skills', href: '/skills' },
      { label: 'Stealth Browsers', href: `${DOCS_URL}/usage/stealth` },
      { label: 'Models', href: `${DOCS_URL}/get-started/models-and-pricing` },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: DOCS_URL },
      { label: 'Blog', href: '/posts' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Templates', href: '/templates' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Careers', href: '/careers' },
      { label: 'SOC 2', href: '/security/soc2' },
      { label: 'Terms', href: '/legal/terms-of-service' },
      { label: 'Privacy', href: '/legal/privacy-policy' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: 'https://github.com/browser-use' },
      { label: 'Twitter', href: 'https://twitter.com/browser_use' },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/browser-use' },
      { label: 'Discord', href: 'https://discord.gg/browser-use' },
    ],
  },
]

function Footer() {
  return (
    <footer id='footer' className='w-full max-w-5xl mx-auto px-6 pt-32 pb-12'>
      <div className='border-t border-zinc-800 pt-12'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12'>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className='bu-font-serif text-sm text-white mb-4'>
                {col.title}
              </h4>
              <div className='flex flex-col gap-2.5'>
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    className='bu-font-mono text-xs text-zinc-500 hover:text-white transition-colors'
                    href={link.href}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className='flex items-center justify-between mt-16 pt-8 border-t border-zinc-800'>
          <span className='bu-font-mono text-xs text-zinc-600'>
            © 2025 Browser Use
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Browser Use logo SVG ───────────────────────────────────────────────────

function BrowserUseLogo() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      fill='none'
      viewBox='0 0 1000 1000'
      className='group-hover:opacity-80 transition-opacity'
    >
      <path
        fill='#fff'
        d='M500 0C223.9 0 0 223.9 0 500s223.9 500 500 500 500-223.9 500-500S776.1 0 500 0zm0 900c-221 0-400-179-400-400S279 100 500 100s400 179 400 400-179 400-400 400z'
      />
    </svg>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function BrowserUsePage() {
  return (
    <div className='bg-page-bg min-h-screen' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Header />
      <Hero />
      <Products />
      <BottomCTA />
      <Footer />
    </div>
  )
}
