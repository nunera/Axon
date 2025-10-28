// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth').BetterAuthUser;
			session: import('$lib/server/auth').BetterAuthSession;
		}
	}
}

export {};
