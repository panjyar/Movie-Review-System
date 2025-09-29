const allowedOrigins = [
  process.env.CLIENT_URL,          // Production URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or Postman)
    if (!origin) return callback(null, true);

    // Detect localhost requests automatically
    const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');

    if (isLocalhost) {
      console.log('CORS allowing localhost origin:', origin);
      return callback(null, true);
    }

    // Allow production client URL
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export default corsOptions;
