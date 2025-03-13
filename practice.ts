import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/chat-app-practice", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as mongoose.ConnectOptions).then(() => console.log("MongoDB connected"));


interface IUser extends mongoose.Document {
    name: string,
    email: string,
    createdAt: number
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    createdAt: { type: Number, default: Date.now },
})

userSchema.index({ email : 1})

const User = mongoose.model<IUser>("User", userSchema)

const fetchData = async () => {
    try {
        const newUser = new User({ name: "Alice", email: "alice@example.com"})
        await newUser.save();
        console.log('User saved:', newUser);
        
        const foundUser = await User.findOne({ email: "alice@example.com"})
        console.log('found User:', foundUser);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close()
    }
}; 

fetchData()