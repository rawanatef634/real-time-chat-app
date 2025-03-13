import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';

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
    const messageData = { id: id || '1', content: content || 'Hello user', sender: sender || 'rawan' };

    if (!messageData.id || typeof messageData.id !== 'string') {
      res.status(400).send('Invalid or missing id');
      return;
    }
    if (!messageData.content || typeof messageData.content !== 'string' || messageData.content.length < 1) {
      res.status(400).send('Content is required and must be a non-empty string');
      return;
    }
    if (!messageData.sender || typeof messageData.sender !== 'string' || messageData.sender.length < 1) {
      res.status(400).send('Sender is required and must be a non-empty string');
      return;
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();
    res.send(savedMessage);
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

app.get('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await Message.findOne({ id: '1' });
    if (!message) res.status(404).send('Message not found');
    else res.send(message);
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

app.get('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const messages = await Message.find().sort({ timestamp: -1 }).skip(skip).limit(limit);
    const total = await Message.countDocuments();

    res.json({ page, limit, total, totalPages: Math.ceil(total / limit), messages });
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

app.delete('/message/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedMessage = await Message.findOneAndDelete({ id });
    if (!deletedMessage) {
      res.status(404).send('Message not found');
      return;
    }
    res.json({ message: 'Message deleted', deleted: deletedMessage });
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

app.get('/', (req: Request, res: Response): void => {
  res.send('Chat App Backend Running');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));