class CustomError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { CustomError };
