export class ErrorObjectFactory {
  private field: string | null;
  private message: string;

  static createError(message: string, field?: string): ErrorObjectFactory[] {
    const errorObject: ErrorObjectFactory = new ErrorObjectFactory();
    errorObject.message = message;
    errorObject.field = field || null;

    return [errorObject];
  }
}
