import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log'}),
        new winston.transports.Console()
    ]
})
class AppError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        status = this.status
    }
}
const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chat-app-practice', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions).then(() => console.log('MongoDB connected'));

interface IMessage extends mongoose.Document {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
}

const messageSchema = new mongoose.Schema<IMessage>({
  id: { type: String, required: true },
  content: { type: String, required: true },
  sender: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
});
messageSchema.index({ timestamp: -1 });
const Message = mongoose.model<IMessage>('Message', messageSchema);

app.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, content, sender } = req.body;
    const messageData = { id, content, sender };

    if (!messageData.id || typeof messageData.id !== 'string') {
        throw new AppError(400, 'Invalid or missing id');
    }
    if (!messageData.content || typeof messageData.content !== 'string' || messageData.content.length < 1) {
        throw new AppError(400, 'Content is required and must be a non-empty string');
    }
    if (!messageData.sender || typeof messageData.sender !== 'string' || messageData.sender.length < 1) {
        throw new AppError(400, 'Sender is required and must be a non-empty string');
    }
    if (await Message.findOne({ id: messageData.id })) {
        throw new AppError(409, 'Message ID already exists');
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();
    res.send(savedMessage);
  } catch (err) {
    const error = err as AppError
    logger.error({ message: error.message, status: error.status || 500, stack: error.stack})
    res.status(error.status || 500).json({ error: error.message})
  }
});

app.get('/message/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const {id} = req.params
    if (!id || typeof id !== 'string') {
        throw new AppError(400, 'Invalid or missing id')
    }
    const message = await Message.findOne({id});
    if (!message) throw new AppError(400, "Message not found")
    res.json(message);
  } catch (err) {
    const error = err as AppError
    logger.error({ message: error.message, status: error.status || 500, stack: error.stack})
    res.status(error.status || 500).json({ error : error.message});
  }
});

app.get('/messages', async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        if (page < 1 || limit < 1) {
        throw new AppError(400, 'Page and limit must be positive integers');
        }
        const skip = (page - 1) * limit;
        const messages = await Message.find().sort({ timestamp: -1 }).skip(skip).limit(limit);
        const total = await Message.countDocuments();
        res.json({ page, limit, total, totalPages: Math.ceil(total / limit), messages });
    } catch (err) {
        const error = err as AppError;
        logger.error({ message: error.message, status: error.status || 500, stack: error.stack });
        res.status(error.status || 500).json({ error: error.message });
    }
});

app.delete('/message/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new AppError(400, 'Invalid or missing id');
      }
      const deletedMessage = await Message.findOneAndDelete({ id });
      if (!deletedMessage) throw new AppError(404, 'Message not found');
      res.json({ message: 'Message deleted', deleted: deletedMessage });
    } catch (err) {
      const error = err as AppError;
      logger.error({ message: error.message, status: error.status || 500, stack: error.stack });
      res.status(error.status || 500).json({ error: error.message });
    }
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
    logger.error({ message: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
})

app.get('/', (req: Request, res: Response): void => {
  res.send('Chat App Backend Running');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));