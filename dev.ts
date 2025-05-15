import { createServer } from 'http';

const runFunction = async (name: string, port: number, src = false) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(`./apps/functions/${name}${src ? '/src' : ''}/index.ts`);
    const handler = mod.defaultHandler || mod.default;

    const server =
        typeof handler === 'function' && handler.length === 2
            ? createServer(handler) // (req, res) style
            : handler.listen // Express app
              ? handler
              : null;

    if (!server) throw new Error(`❌ "${name}" must export an HTTP handler or Express app.`);

    server.listen(port, () => {
        console.log(`✅ ${name} running at http://localhost:${port}`);
    });
};

runFunction('hello-1', 8081);
runFunction('hello-2', 8082);
runFunction('fraud-analysis', 8083, true);
