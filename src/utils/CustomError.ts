class CustomError extends Error {
  data: any;
  success: boolean;
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.data = null;
    this.success = false;
    this.name = new.target.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { CustomError };
