import crypto from 'crypto';

const generateRandomHash = () => {
    const random = crypto.randomBytes(32).toString("hex");
    const hasedToken = crypto.createHash('sha256').update(random).digest('hex');

    return hasedToken;
}

console.log(`random hash`, generateRandomHash());