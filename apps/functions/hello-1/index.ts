import { HttpFunction } from '@google-cloud/functions-framework';
import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello from Function 1 (Express)!');
});

// Cloud Function handler for Google Cloud Functions Gen2
export const defaultHandler: HttpFunction = (req, res) => {
    return app(req, res);
};
