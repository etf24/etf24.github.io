import { i18n } from '$lib/i18n';
import type { Transport } from '@sveltejs/kit';

export const reroute = i18n.reroute();
export const transport: Transport = {};
