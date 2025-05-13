import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello from Function 11 (Express)!');
});

export default app;
