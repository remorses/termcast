/**
 * Termcast landing page.
 * Dark theme with pumpkin orange accent, serif headings (Playfair Display),
 * mono body text, tech logo carousel, product showcase cards, code example,
 * and value props grid.
 */
import 'website/src/styles/landing.css'
import { Github, Menu, ArrowDown, Terminal, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const GITHUB_URL = 'https://github.com/remorses/termcast'
const DOCS_URL = 'https://github.com/remorses/termcast#readme'
const NPM_URL = 'https://www.npmjs.com/package/termcast'
const CHANGELOG_URL = `${GITHUB_URL}/blob/main/termcast/CHANGELOG.md`
const EXAMPLES_URL = `${GITHUB_URL}/tree/main/termcast/src/examples`

const RAYCAST_DOCS = 'https://developers.raycast.com/api-reference'

// ─── Tech logos for the "Powered by" carousel ───────────────────────────────
// Official SVG icons from simpleicons.org + text labels.
// Each logo is rendered as icon (24x24 viewBox scaled to fit) + name text.

function TechLogo({ label, path }: { label: string; path: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 32' aria-label={label} className='w-full h-full'>
      <g transform='translate(4, 4)'>
        <svg viewBox='0 0 24 24' width='24' height='24'>
          <path d={path} fill='#a1a1aa' />
        </svg>
      </g>
      <text x='38' y='21' fill='#a1a1aa' fontSize='13' fontFamily='system-ui, -apple-system, sans-serif' fontWeight='500'>{label}</text>
    </svg>
  )
}

// Official icon paths from simpleicons.org (MIT licensed)
const TECH_LOGOS: Array<{ label: string; path: string }> = [
  {
    label: 'React',
    path: 'M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z',
  },
  {
    label: 'Bun',
    path: 'M12 22.596c6.628 0 12-4.338 12-9.688 0-3.318-2.057-6.248-5.219-7.986-1.286-.715-2.297-1.357-3.139-1.89C14.058 2.025 13.08 1.404 12 1.404c-1.097 0-2.334.785-3.966 1.821a49.92 49.92 0 0 1-2.816 1.697C2.057 6.66 0 9.59 0 12.908c0 5.35 5.372 9.687 12 9.687v.001ZM10.599 4.715c.334-.759.503-1.58.498-2.409 0-.145.202-.187.23-.029.658 2.783-.902 4.162-2.057 4.624-.124.048-.199-.121-.103-.209a5.763 5.763 0 0 0 1.432-1.977Zm2.058-.102a5.82 5.82 0 0 0-.782-2.306v-.016c-.069-.123.086-.263.185-.172 1.962 2.111 1.307 4.067.556 5.051-.082.103-.23-.003-.189-.126a5.85 5.85 0 0 0 .23-2.431Zm1.776-.561a5.727 5.727 0 0 0-1.612-1.806v-.014c-.112-.085-.024-.274.114-.218 2.595 1.087 2.774 3.18 2.459 4.407a.116.116 0 0 1-.049.071.11.11 0 0 1-.153-.026.122.122 0 0 1-.022-.083 5.891 5.891 0 0 0-.737-2.331Zm-5.087.561c-.617.546-1.282.76-2.063 1-.117 0-.195-.078-.156-.181 1.752-.909 2.376-1.649 2.999-2.778 0 0 .155-.118.188.085 0 .304-.349 1.329-.968 1.874Zm4.945 11.237a2.957 2.957 0 0 1-.937 1.553c-.346.346-.8.565-1.286.62a2.178 2.178 0 0 1-1.327-.62 2.955 2.955 0 0 1-.925-1.553.244.244 0 0 1 .064-.198.234.234 0 0 1 .193-.069h3.965a.226.226 0 0 1 .19.07c.05.053.073.125.063.197Zm-5.458-2.176a1.862 1.862 0 0 1-2.384-.245 1.98 1.98 0 0 1-.233-2.447c.207-.319.503-.566.848-.713a1.84 1.84 0 0 1 1.092-.11c.366.075.703.261.967.531a1.98 1.98 0 0 1 .408 2.114 1.931 1.931 0 0 1-.698.869v.001Zm8.495.005a1.86 1.86 0 0 1-2.381-.253 1.964 1.964 0 0 1-.547-1.366c0-.384.11-.76.32-1.079.207-.319.503-.567.849-.713a1.844 1.844 0 0 1 1.093-.108c.367.076.704.262.968.534a1.98 1.98 0 0 1 .4 2.117 1.932 1.932 0 0 1-.702.868Z',
  },
  {
    label: 'TypeScript',
    path: 'M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z',
  },
  {
    label: 'esbuild',
    path: 'M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zM6.718 5.282L13.436 12l-6.718 6.718-2.036-2.036L9.364 12 4.682 7.318zm7.2 0L20.636 12l-6.718 6.718-2.036-2.036L16.564 12l-4.682-4.682z',
  },
  {
    label: 'Raycast',
    path: 'M6.004 15.492v2.504L0 11.992l1.258-1.249Zm2.504 2.504H6.004L12.008 24l1.253-1.253zm14.24-4.747L24 11.997 12.003 0 10.75 1.251 15.491 6h-2.865L9.317 2.692 8.065 3.944l2.06 2.06H8.691v9.31H18v-1.432l2.06 2.06 1.252-1.252-3.312-3.32V8.506ZM6.63 5.372 5.38 6.625l1.342 1.343 1.251-1.253Zm10.655 10.655-1.247 1.251 1.342 1.343 1.253-1.251zM3.944 8.059 2.692 9.31l3.312 3.314v-2.506zm9.936 9.937h-2.504l3.314 3.312 1.25-1.252z',
  },
  {
    label: 'SQLite',
    path: 'M21.678.521c-1.032-.92-2.28-.55-3.513.544a8.71 8.71 0 0 0-.547.535c-2.109 2.237-4.066 6.38-4.674 9.544.237.48.422 1.093.544 1.561a13.044 13.044 0 0 1 .164.703s-.019-.071-.096-.296l-.05-.146a1.689 1.689 0 0 0-.033-.08c-.138-.32-.518-.995-.686-1.289-.143.423-.27.818-.376 1.176.484.884.778 2.4.778 2.4s-.025-.099-.147-.442c-.107-.303-.644-1.244-.772-1.464-.217.804-.304 1.346-.226 1.478.152.256.296.698.422 1.186.286 1.1.485 2.44.485 2.44l.017.224a22.41 22.41 0 0 0 .056 2.748c.095 1.146.273 2.13.5 2.657l.155-.084c-.334-1.038-.47-2.399-.41-3.967.09-2.398.642-5.29 1.661-8.304 1.723-4.55 4.113-8.201 6.3-9.945-1.993 1.8-4.692 7.63-5.5 9.788-.904 2.416-1.545 4.684-1.931 6.857.666-2.037 2.821-2.912 2.821-2.912s1.057-1.304 2.292-3.166c-.74.169-1.955.458-2.362.629-.6.251-.762.337-.762.337s1.945-1.184 3.613-1.72C21.695 7.9 24.195 2.767 21.678.521m-18.573.543A1.842 1.842 0 0 0 1.27 2.9v16.608a1.84 1.84 0 0 0 1.835 1.834h9.418a22.953 22.953 0 0 1-.052-2.707c-.006-.062-.011-.141-.016-.2a27.01 27.01 0 0 0-.473-2.378c-.121-.47-.275-.898-.369-1.057-.116-.197-.098-.31-.097-.432 0-.12.015-.245.037-.386a9.98 9.98 0 0 1 .234-1.045l.217-.028c-.017-.035-.014-.065-.031-.097l-.041-.381a32.8 32.8 0 0 1 .382-1.194l.2-.019c-.008-.016-.01-.038-.018-.053l-.043-.316c.63-3.28 2.587-7.443 4.8-9.791.066-.069.133-.128.198-.194Z',
  },
  {
    label: 'React Query',
    path: 'M6.9297 13.6875c.164-.0938.375-.0352.4687.1328l.0625.1055c.4805.8515.9805 1.6601 1.5 2.4258.6133.9023 1.3047 1.8164 2.0743 2.7421a.3455.3455 0 0 1-.0391.4844l-.0742.0664c-2.543 2.2227-4.1914 2.664-4.9532 1.332-.746-1.3046-.4765-3.6718.8086-7.1093a.3437.3437 0 0 1 .1524-.1797ZM17.75 16.3008c.1836-.0313.3594.086.3945.2695l.0196.1016c.6289 3.2851.1875 4.9297-1.3243 4.9297-1.4804 0-3.3593-1.4024-5.6484-4.2032a.3271.3271 0 0 1-.0742-.2226c0-.1875.1562-.3399.3437-.3399h.1211a32.9838 32.9838 0 0 0 2.8086-.0976c1.0703-.086 2.1914-.2305 3.3594-.4375zm.871-6.9766a.3528.3528 0 0 1 .4454-.211l.1016.0352c3.2617 1.1094 4.5039 2.332 3.7187 3.6641-.7656 1.3047-2.9922 2.254-6.6836 2.8477-.082.0117-.168-.004-.2383-.047-.168-.0976-.2265-.3085-.125-.4765l.0625-.1054c.504-.8438.957-1.6836 1.3672-2.5235.4766-.9883.9297-2.0508 1.3516-3.1836zM7.797 8.3398c.082-.0117.168.004.2383.047.168.0976.2265.3085.125.4765l-.0625.1054a34.0882 34.0882 0 0 0-1.3672 2.5235c-.4766.9883-.9297 2.0508-1.3516 3.1836a.3528.3528 0 0 1-.4453.211l-.1016-.0352c-3.2617-1.1094-4.5039-2.332-3.7187-3.6641.7656-1.3047 2.9922-2.254 6.6836-2.8477Zm5.2812-3.9843c2.543-2.2227 4.1914-2.664 4.9532-1.332.746 1.3046.4765 3.6718-.8086 7.1093a.3436.3436 0 0 1-.1524.1797c-.164.0938-.375.0352-.4687-.1328l-.0625-.1055c-.4805-.8515-.9805-1.6601-1.5-2.4258-.6133-.9023-1.3047-1.8164-2.0743-2.7421a.3455.3455 0 0 1 .0391-.4844Zm-5.793-2.082c1.4805 0 3.3633 1.4023 5.6485 4.203a.3488.3488 0 0 1 .0781.2188c-.0039.1914-.1562.3438-.3476.3438l-.1172-.004a34.5835 34.5835 0 0 0-2.8086.1016c-1.0742.086-2.1953.2305-3.3633.4375a.343.343 0 0 1-.3945-.2734l-.0196-.0977c-.629-3.2851-.1876-4.9297 1.3242-4.9297Zm2.8711 5.8124h3.6875a.638.638 0 0 1 .5508.3164l1.8477 3.2188a.6437.6437 0 0 1 0 .6289l-1.8477 3.2227a.638.638 0 0 1-.5507.3164h-3.6875c-.2266 0-.4375-.1211-.547-.3164L7.7579 12.25a.6437.6437 0 0 1 0-.629l1.8516-3.2187c.1093-.1953.3203-.3164.5468-.3164Zm3.2305.793a.638.638 0 0 1 .5508.3164l1.3906 2.4258a.6437.6437 0 0 1 0 .6289l-1.3906 2.4297a.638.638 0 0 1-.5508.3164h-2.7734c-.2266 0-.4375-.1211-.5469-.3164L8.672 12.25a.6437.6437 0 0 1 0-.629l1.3945-2.4257c.1094-.1953.3203-.3164.5469-.3164Zm-.4922.8672h-1.789c-.2266 0-.4336.1172-.547.3164l-.8983 1.5586a.6437.6437 0 0 0 0 .6289l.8984 1.5625a.6317.6317 0 0 0 .5469.3164h1.789a.6317.6317 0 0 0 .547-.3164l.8983-1.5625a.6437.6437 0 0 0 0-.629l-.8984-1.5585c-.1133-.1992-.3203-.3164-.5469-.3164Zm-.4765.8281c.2265 0 .4375.1211.5468.3164l.422.7305c.1132.1953.1132.4375 0 .6289l-.422.7344c-.1093.1953-.3203.3164-.5468.3164h-.836a.6317.6317 0 0 1-.5468-.3164l-.422-.7344c-.1132-.1914-.1132-.4336 0-.629l.422-.7304a.6317.6317 0 0 1 .5468-.3164zm-.418.8164a.548.548 0 0 0-.4727.2735c-.0976.168-.0976.375 0 .5468a.5444.5444 0 0 0 .4727.2696.5444.5444 0 0 0 .4727-.2696c.0976-.1718.0976-.3789 0-.5468A.548.548 0 0 0 12 11.3906z',
  },
  {
    label: 'React Hook Form',
    path: 'M10.7754 17.3477H5.8065a.2815.2815 0 1 0 0 .563h4.9689a.2815.2815 0 1 0 0-.563zm7.3195 0h-4.9688a.2815.2815 0 1 0 0 .563h4.9688a.2815.2815 0 0 0 0-.563zm-7.3336-6.475H5.8065a.2815.2815 0 1 0 0 .563h4.9548a.2815.2815 0 1 0 0-.563zm7.3195 0h-4.9547a.2815.2815 0 1 0 0 .563h4.9547a.2815.2815 0 0 0 0-.563zm.5518-9.2001h-4.341a2.4042 2.4042 0 0 0-4.5804 0H5.3674c-1.7103 0-3.0968 1.3864-3.0968 3.0967v16.134C2.2706 22.6135 3.6571 24 5.3674 24h13.2652c1.7103 0 3.0968-1.3865 3.0968-3.0967V4.7693c0-1.7103-1.3865-3.0967-3.0968-3.0967zm-8.7046.563a.2815.2815 0 0 0 .2815-.2224 1.8411 1.8411 0 0 1 3.5979 0 .2815.2815 0 0 0 .2815.2224h1.5146v1.844a.8446.8446 0 0 1-.8446.8446H9.2552a.8446.8446 0 0 1-.8446-.8446v-1.844Zm11.2383 18.6677c0 1.3993-1.1344 2.5337-2.5337 2.5337H5.3674c-1.3993 0-2.5337-1.1344-2.5337-2.5337V4.7693c0-1.3993 1.1344-2.5337 2.5337-2.5337h2.4802v1.844c0 .7774.6302 1.4076 1.4076 1.4076h5.4896c.7774 0 1.4076-.6302 1.4076-1.4076v-1.844h2.4802c1.3993 0 2.5337 1.1344 2.5337 2.5337z',
  },
]

function LogoCarousel() {
  return (
    <div className='mt-10 sm:mt-12 w-screen max-w-3xl'>
      <div className='text-center pb-3'>
        <span className='text-[10px] bu-font-mono text-zinc-600 tracking-wide'>
          Powered by
        </span>
      </div>
      <div className='overflow-hidden relative'>
        <div className='absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none' />
        <div className='absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none' />
        <div
          style={{ width: `${TECH_LOGOS.length * 2 * 160}px` }}
          className='flex items-center animate-logo-scroll-compact will-change-transform'
        >
          {[...TECH_LOGOS, ...TECH_LOGOS].map((logo, i) => (
            <div key={i} className='flex-shrink-0 flex items-center justify-center w-[160px] h-[48px] px-2 opacity-70'>
              <TechLogo label={logo.label} path={logo.path} />
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
            <Terminal size={20} className='text-white group-hover:opacity-80 transition-opacity' />
            <span className='bu-font-mono text-[15px] font-bold text-white'>
              termcast
            </span>
          </a>

          {/* Center nav */}
          <div className='hidden lg:flex items-center justify-center gap-7 absolute left-1/2 -translate-x-1/2'>
            <a className={NAV_LINK} href={DOCS_URL} target='_blank' rel='noopener noreferrer'>
              Docs
            </a>
            <a className={NAV_LINK} href={CHANGELOG_URL} target='_blank' rel='noopener noreferrer'>
              Changelog
            </a>
            <a className={NAV_LINK} href={NPM_URL} target='_blank' rel='noopener noreferrer'>
              npm
            </a>
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
              <span>GitHub</span>
            </a>
            {/* <a
              target='_blank'
              rel='noopener noreferrer'
              className='h-8 px-5 text-[13px] font-medium bg-pumpkin-500 text-zinc-950 flex items-center justify-center hover:bg-pumpkin-400 transition-colors'
              href={DOCS_URL}
            >
              Get Started
            </a> */}
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

function InstallCommand() {
  const [copied, setCopied] = useState(false)
  const command = 'bun install -g termcast'

  return (
    <button
      className='flex items-center gap-3 mt-7 sm:mt-8 px-5 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group cursor-pointer'
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
        globalThis.setTimeout(() => {
          setCopied(false)
        }, 2000)
      }}
    >
      <span className='bu-font-mono text-sm text-zinc-400'>
        <span className='text-pumpkin-500'>$</span> {command}
      </span>
      {copied
        ? <Check size={14} className='text-emerald-400' />
        : <Copy size={14} className='text-zinc-600 group-hover:text-zinc-400 transition-colors' />
      }
    </button>
  )
}

function Hero() {
  return (
    <div className='relative z-10 flex flex-col'>
      <div className='flex flex-col items-center justify-center px-6 pt-16 sm:pt-24'>
        <div className='flex flex-col items-center text-center'>
          <h1 className='flex flex-col items-center leading-none'>
            <span className='bu-font-serif text-[72px] sm:text-[100px] md:text-[120px] font-normal uppercase tracking-tight text-white'>
              Raycast
            </span>
            <span className='bu-font-serif italic text-[48px] sm:text-[64px] md:text-[80px] font-normal text-white -mt-2 sm:-mt-3'>
              for the terminal.
            </span>
          </h1>
          <p className='text-zinc-500 bu-font-sans text-sm sm:text-base tracking-wide mt-5 sm:mt-6 max-w-2xl'>
            The fastest way to build terminal apps. React components, Raycast-compatible API,
            <br className='hidden sm:block' /> compile to a single binary. Already have a Raycast extension? Port it.
          </p>
          <InstallCommand />
          <div className='flex items-center gap-5 mt-4'>
            {/* <a
              target='_blank'
              rel='noopener noreferrer'
              className='btn-primary btn-primary-md'
              href={DOCS_URL}
            >
              Get Started
            </a> */}
            <a
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 text-[13px] bu-font-mono text-zinc-300 hover:text-white transition-colors'
              href={GITHUB_URL}
            >
              <Github size={14} />
              View on GitHub
            </a>
          </div>
          <LogoCarousel />
        </div>
        <a
          href='#features'
          className='mt-6 mb-12 flex flex-col items-center gap-1 text-[11px] bu-font-mono text-zinc-600 hover:text-zinc-400 transition-colors'
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
  title,
  description,
  visual,
  reversed = false,
}: {
  title: string
  description: string
  visual: React.ReactNode
  reversed?: boolean
}) {
  return (
    <div className='group grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center'>
      <div className={reversed ? 'order-1 md:order-2' : 'order-1 md:order-1'}>
        <h3 className='bu-font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-white'>
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
    </div>
  )
}

function ListsSearchVisual() {
  const items = [
    { title: 'Deploy to production', subtitle: 'v2.4.1', badge: 'ready', active: true },
    { title: 'Run test suite', subtitle: '142 tests', badge: 'pass', active: false },
    { title: 'Check server logs', subtitle: 'us-east-1', badge: '3 errors', active: false },
    { title: 'Review pull request', subtitle: '#847', badge: 'pending', active: false },
    { title: 'Update dependencies', subtitle: 'package.json', badge: '12 outdated', active: false },
  ]

  return (
    <div className='relative min-h-[280px] md:min-h-0'>
      <div className='bu-font-mono text-xs sm:text-sm leading-loose'>
        <div className='flex items-center gap-2 mb-3 text-zinc-500 border-b border-zinc-800 pb-2'>
          <span className='text-pumpkin-500'>{'>'}</span>
          <span>deploy</span>
          <span className='text-pumpkin-500 animate-pulse'>▌</span>
        </div>
        {items.map((item) => (
          <div key={item.title} className={`flex items-center justify-between ${item.active ? 'text-pumpkin-400/80' : 'text-zinc-500'} transition-colors duration-300`}>
            <span>{item.active ? '› ' : '  '}{item.title}<span className='text-zinc-500 ml-2'>{item.subtitle}</span></span>
            <span className={item.active ? 'text-pumpkin-500/60' : 'text-zinc-600'}>{item.badge}</span>
          </div>
        ))}
      </div>
      <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none' />
    </div>
  )
}

function FormsInputsVisual() {
  const fields = [
    { label: 'name', value: 'my-extension', type: 'text' as const },
    { label: 'template', value: 'list', type: 'dropdown' as const },
    { label: 'language', value: 'TypeScript', type: 'dropdown' as const },
    { label: 'description', value: 'A CLI for managing...', type: 'text' as const },
  ]
  const checkboxes = [
    { label: 'include examples', checked: true },
    { label: 'setup git repo', checked: true },
    { label: 'enable OAuth', checked: false },
  ]

  return (
    <div className='bu-font-mono text-xs sm:text-sm leading-relaxed relative max-w-[340px] min-h-[280px] md:min-h-0'>
      {fields.map((f, i) => (
        <div key={f.label} className={`flex items-center justify-between py-0.5 ${i === 0 ? 'text-pumpkin-400/80' : ''}`}>
          <span className='text-zinc-400'>{i === 0 ? '› ' : '  '}{f.label}</span>
          <span className={i === 0 ? 'text-white' : 'text-zinc-500'}>
            {f.value}
            {f.type === 'dropdown' && <span className='text-zinc-500 ml-1'>▾</span>}
          </span>
        </div>
      ))}
      <div className='border-t border-zinc-800/50 my-2' />
      {checkboxes.map((cb) => (
        <div key={cb.label} className='flex items-center justify-between py-0.5'>
          <span className={cb.checked ? 'text-zinc-400' : 'text-zinc-500'}>{cb.label}</span>
          <span className={cb.checked ? 'text-emerald-500/70' : 'text-zinc-600'}>{cb.checked ? '✓' : '○'}</span>
        </div>
      ))}
      <div className='mt-3 text-zinc-600 text-[10px] tracking-wider'>ctrl+enter to submit  ·  tab to next field</div>
    </div>
  )
}

function GraphsChartsVisual() {
  // Braille sparkline rendering - same technique termcast uses
  const brailleChars = '⣀⣤⣴⣶⣾⣿⡿⠿⠛⠉'
  const sparkline1 = '⣀⣠⣤⣴⣶⣾⣿⣿⡿⠿⠛⠋⠉⠉⠙⠛⠿⣿⣿⣾⣶⣴⣤⣠⣀'
  const sparkline2 = '⠉⠙⠛⠿⣿⣿⣷⣶⣤⣄⣀⣀⣠⣤⣶⣷⣿⣿⠿⠛⠙⠉'

  return (
    <div className='bu-font-mono text-xs sm:text-sm leading-relaxed relative max-w-[360px] min-h-[220px] md:min-h-0'>
      <div className='text-zinc-600 text-[10px] sm:text-xs mb-2 tracking-wider'>STOCK PRICE</div>
      <div className='text-pumpkin-400/70 text-lg tracking-[0.15em] leading-tight'>
        {sparkline1}
      </div>
      <div className='flex justify-between text-zinc-500 text-[10px] mt-1 mb-4'>
        <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
      </div>
      <div className='text-zinc-600 text-[10px] sm:text-xs mb-2 tracking-wider'>MOVING AVERAGE</div>
      <div className='text-emerald-500/50 text-lg tracking-[0.15em] leading-tight'>
        {sparkline2}
      </div>
      <div className='mt-3 text-zinc-500 text-[10px]'>
        ■ <span className='text-pumpkin-400/70'>price</span>{'  '}■ <span className='text-emerald-500/50'>avg</span>{'  '}rendered with braille characters (2x4 sub-pixel)
      </div>
    </div>
  )
}

function CompileDistributeVisual() {
  const steps = [
    { line: '$ termcast compile', color: 'text-zinc-400' },
    { line: '  bundling with esbuild...', color: 'text-zinc-500' },
    { line: '  compiling for darwin-arm64', color: 'text-zinc-500' },
    { line: '  compiling for linux-x64', color: 'text-zinc-500' },
    { line: '✓ my-tool (4.2 MB)', color: 'text-emerald-500/70' },
    { line: '', color: '' },
    { line: '$ termcast release', color: 'text-zinc-400' },
    { line: '✓ Published to GitHub Releases', color: 'text-emerald-500/70' },
  ]

  return (
    <div className='bu-font-mono text-xs sm:text-sm leading-loose relative text-left min-h-[200px] md:min-h-0'>
      {steps.map((s, i) => (
        <div key={i} className={`${s.color} transition-colors duration-300`}>
          {s.line || '\u00A0'}
        </div>
      ))}
      <div className='text-zinc-500 mt-1 border-t border-zinc-800/50 pt-2'>
        <span className='text-zinc-600'>Install anywhere:</span>
      </div>
      <div className='text-pumpkin-400/80'>
        $ curl -sf https://termcast.app/r/my-tool/install | bash
      </div>
    </div>
  )
}

function Features() {
  return (
    <section id='features' className='relative z-10 py-16 sm:py-40 px-6'>
      <div className='max-w-5xl mx-auto flex flex-col gap-16 sm:gap-40'>
        <ProductCard
          title='Lists & Search'
          description='Searchable lists with sections, accessories, detail panels, and full keyboard navigation. Built-in fuzzy search, dropdown filters, pagination, and action shortcuts.'
          visual={<ListsSearchVisual />}
        />
        <ProductCard
          title='Forms & Inputs'
          description='Text fields, dropdowns, checkboxes, tag pickers, date pickers, file pickers. Tab to navigate, ctrl+enter to submit. Validation with react-hook-form.'
          visual={<FormsInputsVisual />}
          reversed
        />
        <ProductCard
          title='Graphs & Charts'
          description='Line charts rendered with braille characters at 2x4 sub-pixel resolution per cell. Stacked bar charts, multiple series, color themes. All inside terminal cells.'
          visual={<GraphsChartsVisual />}
        />
        <ProductCard
          title='Compile & Ship'
          description='termcast compile builds a standalone binary. termcast release publishes to GitHub Releases for macOS, Linux, and Windows. Users install with a single curl command.'
          visual={<CompileDistributeVisual />}
          reversed
        />
      </div>
    </section>
  )
}

// ─── Code example ───────────────────────────────────────────────────────────

function CodeExample() {
  const code = `import { List, Action, ActionPanel } from 'termcast'

function DeployTool() {
  return (
    <List>
      <List.Section title="Production">
        <List.Item
          title="Deploy v2.4.1"
          subtitle="us-east-1"
          accessories={[{ tag: { value: "ready", color: Color.Green } }]}
          actions={
            <ActionPanel>
              <Action title="Deploy" onAction={() => deploy()} />
              <Action title="View Logs" onAction={() => viewLogs()} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  )
}`

  return (
    <section className='relative z-10 py-16 sm:py-32 px-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-10'>
          <h2 className='bu-font-serif text-3xl sm:text-4xl md:text-5xl text-white'>
            Familiar API. Zero learning curve.
          </h2>
          <p className='bu-font-sans text-sm sm:text-base text-zinc-500 mt-4 max-w-xl mx-auto'>
            Same components as Raycast -- List, Form, Detail, ActionPanel.
            Import from <code className='bu-font-mono text-zinc-400'>termcast</code> instead of <code className='bu-font-mono text-zinc-400'>@raycast/api</code>.
          </p>
        </div>
        <div className='bg-zinc-950 border border-zinc-800 overflow-hidden'>
          <div className='flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800'>
            <div className='flex gap-1.5'>
              <div className='w-2.5 h-2.5 rounded-full bg-zinc-800' />
              <div className='w-2.5 h-2.5 rounded-full bg-zinc-800' />
              <div className='w-2.5 h-2.5 rounded-full bg-zinc-800' />
            </div>
            <span className='bu-font-mono text-[11px] text-zinc-600 ml-2'>deploy-tool.tsx</span>
          </div>
          <pre className='p-3 sm:p-6 overflow-x-auto max-w-full'>
            <code className='bu-font-mono text-[10px] sm:text-sm leading-relaxed'>
              {code.split('\n').map((line, i) => (
                <div key={i} className='flex'>
                  <span className='text-zinc-700 select-none w-8 text-right mr-4 flex-shrink-0'>{i + 1}</span>
                  <span>
                    <CodeLine line={line} />
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </section>
  )
}

/**
 * Minimal syntax highlighting for JSX/TSX code.
 * Tokenizes the line into typed segments, then renders each with a color class.
 * Avoids string-replace with XML-like markers which breaks on JSX angle brackets.
 */
function CodeLine({ line }: { line: string }) {
  const colorMap: Record<string, string> = {
    keyword: 'text-pumpkin-400/80',
    string: 'text-emerald-400/80',
    tag: 'text-pumpkin-300/70',
    attr: 'text-zinc-300',
    comment: 'text-zinc-600',
    punct: 'text-zinc-600',
    plain: 'text-zinc-400',
  }

  // Ordered list of token patterns. First match wins at each position.
  const tokenPatterns: Array<{ type: string; re: RegExp }> = [
    { type: 'comment', re: /^\/\/.*$/ },
    { type: 'string', re: /^"[^"]*"/ },
    { type: 'string', re: /^'[^']*'/ },
    { type: 'string', re: /^`[^`]*`/ },
    { type: 'keyword', re: /^(?:import|from|function|return|const|export)\b/ },
    // JSX opening/closing tags: <List.Section, </ActionPanel>, <Action
    { type: 'tag', re: /^<\/?[\w.]+/ },
    // JSX attribute names followed by =
    { type: 'attr', re: /^(?:title|subtitle|accessories|actions|tag|value|color|onAction)(?==)/ },
    // Arrow function
    { type: 'keyword', re: /^=>/ },
    // Punctuation
    { type: 'punct', re: /^[{}()[\];,>=/]/ },
    // Anything else: one or more characters until next interesting token
    { type: 'plain', re: /^[^\s"'`<{}()[\];,>=/]+/ },
    // Whitespace
    { type: 'plain', re: /^\s+/ },
  ]

  const tokens: Array<{ type: string; text: string }> = []
  let remaining = line

  while (remaining.length > 0) {
    let matched = false
    for (const { type, re } of tokenPatterns) {
      const m = remaining.match(re)
      if (m) {
        tokens.push({ type, text: m[0] })
        remaining = remaining.slice(m[0].length)
        matched = true
        break
      }
    }
    // Safety: consume one char if nothing matched
    if (!matched) {
      tokens.push({ type: 'plain', text: remaining[0] })
      remaining = remaining.slice(1)
    }
  }

  return (
    <>
      {tokens.map((tok, i) => (
        <span key={i} className={colorMap[tok.type] || colorMap.plain}>{tok.text}</span>
      ))}
    </>
  )
}

// ─── Why Termcast ───────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    title: 'Raycast-compatible',
    description: 'Same List, Form, Detail, ActionPanel components. Port existing Raycast extensions or start fresh -- either way, the API is the same.',
  },
  {
    title: 'AI-friendly API',
    description: 'The Raycast API has thousands of open-source extensions. LLMs and coding agents already know it. They can generate termcast code out of the box.',
  },
  {
    title: 'Single binary',
    description: 'termcast compile produces one portable executable. termcast release publishes to GitHub Releases for macOS, Linux, and Windows.',
  },
  {
    title: 'Cross-platform',
    description: 'Raycast is macOS-only. Termcast runs on Linux, Docker, CI, remote servers -- anywhere with a terminal.',
  },
  {
    title: 'Built on OpenTUI',
    description: 'Terminal rendering powered by OpenTUI -- a layout engine with Yoga flexbox, braille graphics, and sub-pixel resolution.',
  },
  {
    title: 'Terminal-native',
    description: 'Things Raycast can\'t do: read CWD, accept stdin, parse CLI args, access env vars. Your TUI integrates with terminal workflows.',
  },
]

function WhyTermcast() {
  return (
    <section className='relative z-10 py-16 sm:py-32 px-6'>
      <div className='max-w-5xl mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='bu-font-serif text-3xl sm:text-4xl md:text-5xl text-white'>
            Why termcast?
          </h2>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10'>
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className='group'>
              <h3 className='bu-font-mono text-sm font-bold text-pumpkin-400 mb-2'>
                {prop.title}
              </h3>
              <p className='bu-font-sans text-sm text-zinc-500 leading-relaxed'>
                {prop.description}
              </p>
            </div>
          ))}
        </div>
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
        <div className='bu-font-mono text-sm text-zinc-500 mt-6 max-w-lg'>
          <div className='mb-4'>
            <span className='text-zinc-600'>New project or existing Raycast extension -- up and running in seconds:</span>
          </div>
          <div className='bg-zinc-950 border border-zinc-800 px-5 py-3 text-left'>
            <div><span className='text-pumpkin-500'>$</span> <span className='text-zinc-400'>termcast new my-tool</span></div>
            <div><span className='text-pumpkin-500'>$</span> <span className='text-zinc-400'>cd my-tool && termcast dev</span></div>
          </div>
        </div>
        <div className='flex items-center gap-5 mt-8'>
          <a
            target='_blank'
            rel='noopener noreferrer'
            className='btn-primary btn-primary-md'
            href={DOCS_URL}
          >
            Read the Docs
          </a>
          <a
            target='_blank'
            rel='noopener noreferrer'
            className='bu-font-mono text-sm text-zinc-500 hover:text-white transition-colors'
            href={EXAMPLES_URL}
          >
            View Examples
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────

const FOOTER_COLUMNS = [
  {
    title: 'Components',
    links: [
      { label: 'List', href: `${RAYCAST_DOCS}/user-interface/list` },
      { label: 'Form', href: `${RAYCAST_DOCS}/user-interface/form` },
      { label: 'Detail', href: `${RAYCAST_DOCS}/user-interface/detail` },
      { label: 'Grid', href: `${RAYCAST_DOCS}/user-interface/grid` },
      { label: 'Action Panel', href: `${RAYCAST_DOCS}/user-interface/action-panel` },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: DOCS_URL },
      { label: 'Changelog', href: CHANGELOG_URL },
      { label: 'Examples', href: EXAMPLES_URL },
      { label: 'npm', href: NPM_URL },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'Issues', href: `${GITHUB_URL}/issues` },
      { label: 'Releases', href: `${GITHUB_URL}/releases` },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: 'https://github.com/remorses' },
      { label: 'Twitter', href: 'https://twitter.com/__morse' },
    ],
  },
]

function Footer() {
  return (
    <footer id='footer' className='w-full max-w-5xl mx-auto px-6 pt-16 sm:pt-32 pb-12'>
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
                    target='_blank'
                    rel='noopener noreferrer'
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
            termcast
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TermcastPage() {
  return (
    <div className='bg-page-bg min-h-screen' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Header />
      <Hero />
      <Features />
      <CodeExample />
      <WhyTermcast />
      <BottomCTA />
      <Footer />
    </div>
  )
}
