import * as dotenv from 'dotenv';

import mongoose from 'mongoose';

dotenv.config();
const mongoURL: string = (process.env.MONGO_URL as string);

export default mongoose.connect(mongoURL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    });
