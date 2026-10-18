/** 画布工具错误（带机读 code）。 */
export class CanvasToolError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CanvasToolError';
    this.code = code;
  }
}
