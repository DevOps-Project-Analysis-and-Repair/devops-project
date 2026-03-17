import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const vitestConfig = defineConfig({
    test: {
        environment: "happy-dom",
        globals: true,
    },
});

//@ts-ignore
export default mergeConfig(viteConfig, vitestConfig);



