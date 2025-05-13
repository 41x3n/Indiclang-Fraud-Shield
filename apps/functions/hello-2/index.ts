import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello from Function 22 (Express)!');
});

export default app;
