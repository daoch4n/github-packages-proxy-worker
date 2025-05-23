/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const GITHUB_PACKAGES_REGISTRY = 'https://npm.pkg.github.com';
		const GITHUB_ORG_SCOPE = '@daoch4n';

		const url = new URL(request.url);
		const packageName = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;

		// Only proxy requests for the specified scope
		if (!packageName.startsWith(`${GITHUB_ORG_SCOPE}/`)) {
			return new Response('Not found', { status: 404 });
		}

		// Construct the target URL for GitHub Packages
		const targetUrl = `${GITHUB_PACKAGES_REGISTRY}/${packageName}${url.search}`;

		// Create new headers for the forwarded request
		const headers = new Headers(request.headers);
		if (env.GITHUB_PAT) {
			headers.set('Authorization', `Bearer ${env.GITHUB_PAT}`);
		} else {
			console.warn('GITHUB_PAT secret is not set. Requests to GitHub Packages may fail.');
		}

		// Forward the request to GitHub Packages
		try {
			const response = await fetch(targetUrl, {
				method: request.method,
				headers: headers,
				body: request.body,
				redirect: 'follow', // Follow redirects from GitHub Packages
			});

			// Return the response from GitHub Packages to the client
			return response;
		} catch (error) {
			console.error('Error fetching from GitHub Packages:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
