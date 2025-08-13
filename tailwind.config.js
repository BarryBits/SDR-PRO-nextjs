/** @type {import("tailwindcss").Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
        // As fontes já são excelentes, então vamos mantê-las.
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			heading: [
  				'Plus Jakarta Sans',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'Fira Code',
  				'monospace'
  			]
  		},
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			neutral: {
  				'50': 'hsl(var(--neutral-50))',
  				'100': 'hsl(var(--neutral-100))',
  				'200': 'hsl(var(--neutral-200))',
  				'300': 'hsl(var(--neutral-300))',
  				'400': 'hsl(var(--neutral-400))',
  				'500': 'hsl(var(--neutral-500))',
  				'600': 'hsl(var(--neutral-600))',
  				'700': 'hsl(var(--neutral-700))',
  				'800': 'hsl(var(--neutral-800))',
  				'900': 'hsl(var(--neutral-900))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(0 0% 100%)'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(0 0% 100%)'
  			},
  			error: {
  				DEFAULT: 'hsl(var(--error))',
  				foreground: 'hsl(0 0% 100%)'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(0 0% 100%)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
        // Sombras mantidas, mas adicionamos uma nova sombra "aurora"
  			premium: 'var(--shadow-xl)',
  			soft: 'var(--shadow-md)',
  			subtle: 'var(--shadow-sm)',
  			glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        aurora: '0 10px 30px -10px hsl(var(--primary) / 0.3)', // <-- NOVA SOMBRA
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem'
  		},
  		transitionDuration: {
  			'300': '300ms'
  		},
  		transitionTimingFunction: {
  			'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
  		},
  		keyframes: {
  			'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  			'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
  			'fade-in': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
  			'slide-in-from-bottom': { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
  			'zoom-in': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
  			'shimmer': { '0%': { backgroundPosition: '-200px 0' }, '100%': { backgroundPosition: 'calc(200px + 100%) 0' } }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
  			'zoom-in': 'zoom-in 0.2s ease-out',
  			'shimmer': 'shimmer 1.5s infinite'
  		},
  		backgroundImage: {
        // Atualizamos os gradientes para usar nossas novas cores primária e secundária
  			'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
  			'gradient-accent': 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)',
        'gradient-aurora': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)', // <-- NOVO GRADIENTE
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		backdropBlur: {
  			xs: '2px'
  		},
  		maxWidth: {
  			'8xl': '88rem',
  			'9xl': '96rem'
  		},
  		zIndex: { '60': '60', '70': '70', '80': '80', '90': '90', '100': '100' }
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};