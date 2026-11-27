# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deploy to Vercel
1. Push this repo to GitHub and import it in Vercel (framework: Other; build `npm run build`).
2. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (values from `.env`).
3. Deploy. Demo login: demo@mppaints.app / DemoMP2026!

### Paint Adviser on Vercel
The adviser uses a server-only `LOVABLE_API_KEY`. It is managed automatically on Lovable; for a separate Vercel deployment, add your own Lovable API key to Vercel's encrypted environment variables and redeploy. Never prefix it with `VITE_` or include it in source. Staff membership and catalog reads use the signed-in user's existing access; no service-role key is needed for the adviser.

### Printing
Thermal receipts use 76mm content on an 80mm roll; select the printer's 80mm paper setting. A4 receipts use 194mm content with 8mm page margins. Use 100% scale and disable browser headers/footers. Logo dimensions are 23mm (thermal) and 32mm (A4). Recommendations are estimates, not verified manufacturer coverage; packs labelled only as buckets or kilograms require verified litre capacity before a quote.
