import { HttpFunction } from '@google-cloud/functions-framework';

import { app } from './app';

export const defaultHandler: HttpFunction = (req, res) => {
    return app(req, res);
};
