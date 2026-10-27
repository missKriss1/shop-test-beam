
import { createInertiaApp } from '@inertiajs/react';
const echoKey = import.meta.env.VITE_REVERB_APP_KEY;
const echoHost = import.meta.env.VITE_REVERB_HOST;

if (echoKey && echoHost && echoHost !== '127.0.0.1' && echoHost !== 'localhost') {
    }

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: { color: '#4B5563' },
});
