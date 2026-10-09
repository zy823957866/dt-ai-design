/** 结果校验器（占位实现）：校验执行结果是否符合预期。 */
export class Validator {
  validate(result: unknown): boolean {
    return result != null;
  }
}
