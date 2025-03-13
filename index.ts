import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';

// Initialize Express app
const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Middleware to parse JSON bodies (for POST requests)
app.use(express.json());

// Connect to MongoDB with options
mongoose
  .connect('mongodb://localhost:27017/chat-app-practice', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Message interface and schema
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

// Index timestamp for efficient sorting (newest first)
messageSchema.index({ timestamp: -1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);

// POST route to create a message
app.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const message = new Message({
      id: '1',
      content: 'Hello user',
      sender: 'rawan',
    });
    const savedMessage = await message.save(); // Save to MongoDB
    res.send(savedMessage);
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

// GET route to fetch a message by custom id
app.get('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await Message.findOne({ id: '1' }); // Use findOne for custom id
    if (!message) {
      res.status(404).send('Message not found');
      return;
    }
    res.send(message);
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

// Default welcome route
app.get('/', (req: Request, res: Response): void => {
  res.send('Chat App Backend Running');
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));