import express, { Express, Request, Response } from 'express';
const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.get('/', (req: Request, res: Response) => 
    {
        res.send('Chat App Backend Running')
    });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));